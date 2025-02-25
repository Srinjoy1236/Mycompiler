import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('resume');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParser = new PDFParser();

    const text = await new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        // Improve text extraction
        const text = pdfData.Pages
          .map(page => 
            page.Texts
              .map(text => text.R
                .map(r => decodeURIComponent(r.T))
                .join('')
              )
              .join(' ')
          )
          .join('\n');
        resolve(text);
      });
      
      pdfParser.on('pdfParser_dataError', (error) => {
        reject(error);
      });

      pdfParser.parseBuffer(buffer);
    });

    const fullText = text as string;
    
    // Clean up extracted text
    const cleanText = fullText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\/.@]/g, ' ')
      .toLowerCase()
      .trim();

    console.log('Extracted Text:', cleanText); // For debugging

    interface Keywords {
      [key: string]: number;
    }

    // Improved keyword patterns
    const keywordPatterns = {
      'Programming': /\b(software engineer|developer|programming|coding|development)\b/gi,
      'Frontend': /\b(frontend|react|angular|vue|javascript|typescript|html|css)\b/gi,
      'Backend': /\b(backend|node|express|api|rest|graphql|server)\b/gi,
      'Database': /\b(sql|mysql|postgresql|mongodb|database|redis|nosql)\b/gi,
      'Cloud': /\b(aws|amazon|azure|gcp|cloud|s3|ec2|lambda)\b/gi,
      'DevOps': /\b(docker|kubernetes|jenkins|cicd|devops|git)\b/gi,
      'Testing': /\b(testing|jest|junit|cypress|selenium|test)\b/gi,
      'Languages': /\b(java|python|javascript|typescript|go|rust|cpp|c\+\+)\b/gi,
      'Frameworks': /\b(spring|django|flask|laravel|react|angular|vue)\b/gi,
      'Tools': /\b(git|github|jira|confluence|bitbucket|gitlab)\b/gi
    };

    // Count keyword matches
    const keywords: Keywords = Object.entries(keywordPatterns).reduce((acc, [key, pattern]) => {
      const matches = cleanText.match(pattern) || [];
      if (matches.length > 0) {
        acc[key] = matches.length;
      }
      return acc;
    }, {} as Keywords);

    console.log('Found Keywords:', keywords); // For debugging

    // Filter out zero matches and sort by count
    const filteredKeywords = Object.fromEntries(
      Object.entries(keywords)
        .filter(([_, count]) => count > 0)
        .sort(([_, a], [__, b]) => b - a)
    );

    // Log for debugging
    console.log('Full Text:', fullText);
    console.log('Keywords Found:', keywords);

    // More precise format scoring
    const formatChecks = {
      // Essential sections with quality checks
      contactInfo: /email|phone|linkedin|github|location|portfolio/gi.test(fullText) ? 
        (fullText.match(/(^|\s)[\w\.-]+@[\w\.-]+\.\w+/g) ? 15 : 10) : 0,
      education: /education|university|degree|bachelor|master|phd|gpa/gi.test(fullText) ? 
        (/\b[3-4]\.[0-9]/g.test(fullText) ? 20 : 15) : 0,
      experience: /experience|work history|employment|position|role|company/gi.test(fullText) ? 
        ((fullText.match(/\b(19|20)\d{2}\b/g)?.length ?? 0) > 2 ? 25 : 20) : 0,
      skills: /technical skills|technologies|programming languages|expertise|tools/gi.test(fullText) ? 
        (Object.keys(keywords).length > 8 ? 20 : 15) : 0,

      // Impact scoring
      metrics: (fullText.match(/increased|decreased|improved|reduced|[\d%\+]|optimized|enhanced|accelerated/gi) || []).length * 5,
      achievements: (fullText.match(/achieved|awarded|recognized|led|spearheaded|implemented/gi) || []).length * 3,

      // Professional formatting (bonus points)
      bulletPoints: /•|\-|\*/g.test(fullText) ? 5 : 0,
      sections: /summary|objective|profile|projects|certifications/gi.test(fullText) ? 5 : 0,
    };

    const formatScore = Math.min(100, Object.values(formatChecks).reduce((a, b) => a + b, 0));

    // Dynamic readability scoring
    const sentences = fullText.split(/[.!?]+/).length;
    const words = fullText.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    const readabilityScore = Math.min(100, Math.max(60,
      90 - Math.abs(avgWordsPerSentence - 15) * 2 +
      (fullText.match(/[A-Z][a-z]+/g)?.length || 0) / words * 20
    ));

    // Progressive keyword scoring
    const totalKeywords = Object.values(keywords).reduce((a, b) => a + b, 0);
    const uniqueKeywords = Object.values(keywords).filter(v => v > 0).length;
    const keywordScore = Math.min(100, Math.max(60,
      65 + (totalKeywords * 2) + (uniqueKeywords * 3)
    ));

    // Weighted score with experience level consideration
    const experienceLevel = fullText.match(/senior|lead|principal|architect/gi) ? 1.1 : 
                          fullText.match(/junior|entry|intern/gi) ? 0.9 : 1;

    const overallScore = Math.round(
      ((formatScore * 0.35) +
      (readabilityScore * 0.25) +
      (keywordScore * 0.40)) * experienceLevel
    );

    // Final calibration based on quality indicators
    const qualityMultiplier = 
      (fullText.length > 3000 ? 1.1 : 1) * // Length bonus
      (Object.values(keywords).filter(v => v > 2).length > 5 ? 1.1 : 1); // Expertise bonus

    const finalScore = Math.min(98, Math.max(60, 
      Math.round(overallScore * qualityMultiplier)
    ));

    // Analysis results
    interface Analysis {
      score: number;
      feedback: string[];
      suggestions: string[];
    }

    const analyzeResume = (fullText: string): Analysis => {
      const feedback: string[] = [];
      const suggestions: string[] = [];

      // Check resume length
      const wordCount = fullText.split(/\s+/).length;
      if (wordCount < 300) {
        suggestions.push("Resume is too short. Aim for 400-600 words.");
      } else if (wordCount > 1000) {
        suggestions.push("Resume might be too long. Consider condensing it.");
      }

      // Check contact information
      if (!/(^|\s)[\w\.-]+@[\w\.-]+\.\w+/g.test(fullText)) {
        suggestions.push("Add a professional email address.");
      }
      if (!/linkedin\.com/i.test(fullText)) {
        suggestions.push("Include your LinkedIn profile URL.");
      }
      if (!/github\.com/i.test(fullText)) {
        suggestions.push("Add your GitHub profile for technical roles.");
      }

      // Check sections
      if (!/education|university|degree/gi.test(fullText)) {
        suggestions.push("Add an Education section.");
      } else {
        feedback.push("✓ Education section present");
      }

      if (!/experience|work history/gi.test(fullText)) {
        suggestions.push("Add a Work Experience section.");
      } else {
        feedback.push("✓ Work Experience section present");
      }

      // Check for metrics and achievements
      const metricsCount = (fullText.match(/increased|decreased|improved|reduced|[\d%\+]/gi) || []).length;
      if (metricsCount < 3) {
        suggestions.push("Add more quantifiable achievements (%, numbers, metrics).");
      } else {
        feedback.push(`✓ Found ${metricsCount} quantifiable metrics`);
      }

      // Technical skills analysis
      const techSkills = [
        'javascript', 'python', 'java', 'react', 'node', 'aws', 'docker',
        'kubernetes', 'sql', 'nosql', 'git', 'ci/cd', 'agile'
      ];

      const foundSkills = techSkills.filter(skill => 
        new RegExp(skill, 'gi').test(fullText)
      );

      // Only add to feedback if skills were found
      if (foundSkills.length > 0) {
        feedback.push(`✓ Found ${foundSkills.length} technical skills: ${foundSkills.join(', ')}`);
      } else {
        suggestions.push("Add relevant technical skills to your resume");
      }

      if (foundSkills.length < 6) {
        suggestions.push("Consider adding more technical skills for better ATS matching");
      }

      // Check for action verbs
      const actionVerbs = [
        'developed', 'implemented', 'designed', 'created', 'managed',
        'led', 'architected', 'built', 'optimized', 'improved'
      ];

      const foundVerbs = actionVerbs.filter(verb => 
        new RegExp(`\\b${verb}\\b`, 'gi').test(fullText)
      );

      if (foundVerbs.length < 5) {
        suggestions.push("Use more action verbs to describe your experiences.");
      } else {
        feedback.push("✓ Good use of action verbs");
      }

      // Calculate final score
      const score = Math.min(98, Math.max(60,
        65 + 
        (foundSkills.length * 2) +
        (metricsCount * 3) +
        (foundVerbs.length * 2) +
        (feedback.length * 2)
      ));

      return {
        score,
        feedback,
        suggestions
      };
    };

    const analysis = analyzeResume(fullText);

    return NextResponse.json({
      overall: analysis.score,
      feedback: analysis.feedback,
      suggestions: analysis.suggestions,
      keywords: filteredKeywords,
      format: formatScore,
      readability: readabilityScore
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
} 