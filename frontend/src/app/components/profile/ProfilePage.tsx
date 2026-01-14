import { useState } from "react";
import { User, Mail, Shield, Calendar, Building2, LogOut, Edit2, Save, ArrowLeft, Phone, Globe } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RoleIndicator } from "../shared/RoleIndicator";

interface ProfilePageProps {
  userEmail: string;
  userRole: 'founder' | 'manager' | 'client';
  onLogout: () => void;
  onBack: () => void;
}

export function ProfilePage({ userEmail, userRole, onLogout, onBack }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userRole === 'founder' ? 'John Anderson' : userRole === 'manager' ? 'Sarah Mitchell' : 'Alex Thompson',
    email: userEmail,
    phone: '+1 (555) 123-4567',
    jobTitle: userRole === 'founder' ? 'Founder & CEO' : userRole === 'manager' ? 'Project Manager' : 'Client Contact',
    department: userRole === 'founder' ? 'Executive' : userRole === 'manager' ? 'Operations' : 'N/A',
    timezone: 'Pacific Time (PT)',
  });

  const handleSave = () => {
    setIsEditing(false);
    // Save logic would go here
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
  };

  const accountCreated = userRole === 'founder' ? 'January 15, 2024' : userRole === 'manager' ? 'March 22, 2024' : 'December 10, 2024';
  const lastLogin = 'Just now';
  const assignedCommitments = userRole === 'founder' ? 'All commitments' : userRole === 'manager' ? '12 active commitments' : '5 commitments';

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#6B7280] hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-[14px] font-medium">Back</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-[24px] lg:text-[28px] text-[#0F172A] font-semibold mb-2">
                My Profile
              </h1>
              <p className="text-[14px] lg:text-[15px] text-[#6B7280]">
                Manage your personal information and account settings
              </p>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="h-11 border-[#E5E7EB] hover:bg-[#F4F5F7] w-full sm:w-auto"
              >
                <Edit2 className="w-[16px] h-[16px] mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="h-11 border-[#E5E7EB] hover:bg-[#F4F5F7] flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-11 flex-1 sm:flex-initial"
                >
                  <Save className="w-[16px] h-[16px] mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Profile Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#6366F1] h-32 lg:h-40" />
          
          <div className="px-6 lg:px-8 pb-6 lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 lg:-mt-20 mb-8">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center">
                    <User className="w-12 h-12 lg:w-14 lg:h-14 text-white" />
                  </div>
                </div>
                <div className="mb-2">
                  <h3 className="text-[20px] lg:text-[22px] text-[#0F172A] font-semibold mb-2">
                    {formData.fullName}
                  </h3>
                  <RoleIndicator role={userRole} />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <div>
                <h4 className="text-[16px] text-[#0F172A] font-semibold mb-5 pb-3 border-b border-[#E5E7EB]">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] text-[#6B7280] font-medium mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="h-11"
                      />
                    ) : (
                      <div className="text-[14px] text-[#0F172A] h-11 flex items-center px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                        {formData.fullName}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] text-[#6B7280] font-medium mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-11"
                      />
                    ) : (
                      <div className="text-[14px] text-[#0F172A] h-11 flex items-center px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                        <Mail className="w-4 h-4 mr-2 text-[#9CA3AF]" />
                        {formData.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] text-[#6B7280] font-medium mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-11"
                      />
                    ) : (
                      <div className="text-[14px] text-[#0F172A] h-11 flex items-center px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                        <Phone className="w-4 h-4 mr-2 text-[#9CA3AF]" />
                        {formData.phone}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] text-[#6B7280] font-medium mb-2">
                      Job Title
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="h-11"
                      />
                    ) : (
                      <div className="text-[14px] text-[#0F172A] h-11 flex items-center px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                        {formData.jobTitle}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] text-[#6B7280] font-medium mb-2">
                      Department
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="h-11"
                      />
                    ) : (
                      <div className="text-[14px] text-[#0F172A] h-11 flex items-center px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                        <Building2 className="w-4 h-4 mr-2 text-[#9CA3AF]" />
                        {formData.department}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] text-[#6B7280] font-medium mb-2">
                      Timezone
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-lg text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                      >
                        <option>Pacific Time (PT)</option>
                        <option>Mountain Time (MT)</option>
                        <option>Central Time (CT)</option>
                        <option>Eastern Time (ET)</option>
                      </select>
                    ) : (
                      <div className="text-[14px] text-[#0F172A] h-11 flex items-center px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                        <Globe className="w-4 h-4 mr-2 text-[#9CA3AF]" />
                        {formData.timezone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 lg:p-8 mb-6">
          <h4 className="text-[16px] text-[#0F172A] font-semibold mb-5 pb-3 border-b border-[#E5E7EB]">
            Account Information
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <dt className="text-[13px] text-[#6B7280] mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Account Role
              </dt>
              <dd className="text-[15px] text-[#0F172A] font-medium capitalize">{userRole}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#6B7280] mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </dt>
              <dd className="text-[15px] text-[#0F172A] font-medium">{accountCreated}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#6B7280] mb-2">Last Login</dt>
              <dd className="text-[15px] text-[#0F172A] font-medium">{lastLogin}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-[13px] text-[#6B7280] mb-2">Access Level</dt>
              <dd className="text-[15px] text-[#0F172A] font-medium">{assignedCommitments}</dd>
            </div>
          </dl>
        </div>

        {/* Security Actions */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 lg:p-8">
          <h4 className="text-[16px] text-[#0F172A] font-semibold mb-5 pb-3 border-b border-[#E5E7EB]">
            Security & Access
          </h4>
          <div className="space-y-4">
            <button className="w-full sm:w-auto px-6 h-11 bg-white border border-[#E5E7EB] text-[#4B5563] rounded-lg hover:bg-[#F4F5F7] transition-colors text-[14px] font-medium">
              Change Password
            </button>
            <div className="h-px bg-[#E5E7EB] my-6" />
            <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-[15px] text-[#0F172A] font-semibold mb-1">
                    Logout from this account
                  </div>
                  <div className="text-[13px] text-[#6B7280]">
                    You will be redirected to the sign-in page
                  </div>
                </div>
                <Button
                  onClick={onLogout}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white h-11 px-6 w-full sm:w-auto font-medium"
                >
                  <LogOut className="w-[16px] h-[16px] mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}