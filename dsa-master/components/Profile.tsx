import React, { useState, useEffect } from 'react';

interface ProfileData {
  name: string;
  email: string;
  progress: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    progress: '0/455 topics completed'
  });

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('user-profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('user-profile', JSON.stringify(profile));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-[#151821] dark:via-[#1D1E26] dark:to-[#1F2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative bg-white/50 dark:bg-[#1D1E26]/50 rounded-lg p-6 shadow-lg backdrop-blur-sm">
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-4 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Profile</h2>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-[#0F172A] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-white">{profile.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-[#0F172A] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-white">{profile.email || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Progress</label>
                <p className="text-white">{profile.progress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 