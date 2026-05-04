import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/PageShell';
import { Briefcase, MapPin, Calendar, MessageCircle, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  postedBy: string;
  postedAt: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Need 20T Excavator for Highway Project',
    description: 'Looking for a reliable 20T excavator with operator for a 3-month highway expansion project.',
    location: 'Mumbai, Maharashtra',
    duration: '3 Months',
    postedBy: 'L&T Construction',
    postedAt: '2 hours ago'
  },
  {
    id: '2',
    title: 'Require Crane for 5 Days - High Rise Building',
    description: 'Need a tower crane for lifting materials to the 15th floor. Quick mobilization required.',
    location: 'Pune, Maharashtra',
    duration: '5 Days',
    postedBy: 'Pristine Developers',
    postedAt: '5 hours ago'
  },
  {
    id: '3',
    title: 'JCB Backhoe Loader needed for trenching',
    description: 'Trenching work for pipeline laying. Need JCB with experienced operator.',
    location: 'Nashik, Maharashtra',
    duration: '10 Days',
    postedBy: 'Rajesh Infra',
    postedAt: '1 day ago'
  }
];

export default function JobBoardPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [showPostModal, setShowPostModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('');

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to post a requirement.');
      navigate('/login');
      return;
    }
    const newJob: Job = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      location,
      duration,
      postedBy: 'You',
      postedAt: 'Just now'
    };
    setJobs([newJob, ...jobs]);
    setShowPostModal(false);
    setTitle('');
    setDescription('');
    setLocation('');
    setDuration('');
  };

  const handleContact = (jobId: string) => {
    if (!isAuthenticated) {
      alert('Please log in to contact the poster.');
      navigate('/login');
      return;
    }
    alert(`In a full implementation, this would open a chat with the poster of job ${jobId} so you can propose your machinery offer.`);
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell breadcrumb="Job Board">
      <div className="max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-sora text-[#101214] flex items-center gap-2">
              <Briefcase className="text-[#FF6A00]" /> Project Requirements
            </h1>
            <p className="text-[#6F757C] text-sm mt-1">
              Find contractors looking for machinery, or post your own requirements.
            </p>
          </div>
          <button 
            onClick={() => setShowPostModal(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 whitespace-nowrap"
          >
            <Plus size={18} /> Post a Requirement
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F757C]" size={20} />
          <input 
            type="text" 
            placeholder="Search by keyword, location, or machine type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#EDE8E0] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-[#FF6A00] transition-colors"
          />
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#EDE8E0]">
              <p className="text-[#6F757C]">No requirements found matching your search.</p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl border border-[#EDE8E0] p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#101214] mb-2">{job.title}</h2>
                    <p className="text-[#6F757C] text-sm mb-4 leading-relaxed">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#6F757C]">
                      <span className="flex items-center gap-1 bg-[#F5F3EF] px-2.5 py-1 rounded-md">
                        <MapPin size={14} className="text-[#FF6A00]" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1 bg-[#F5F3EF] px-2.5 py-1 rounded-md">
                        <Calendar size={14} className="text-[#FF6A00]" /> {job.duration}
                      </span>
                      <span>Posted by <strong className="text-[#101214]">{job.postedBy}</strong></span>
                      <span className="text-[#A0A4AB]">• {job.postedAt}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleContact(job.id)}
                    className="shrink-0 flex items-center justify-center gap-2 border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm"
                  >
                    <MessageCircle size={16} /> Propose Offer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#101214]">Post a Requirement</h2>
              <button onClick={() => setShowPostModal(false)} className="text-[#6F757C] hover:text-[#101214]">
                ✕
              </button>
            </div>
            
            <form onSubmit={handlePostJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#101214] mb-1">Title</label>
                <input 
                  required
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Need 20T Excavator for Highway Project"
                  className="w-full border border-[#EDE8E0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#101214] mb-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your project, required machinery specs, and any operator requirements..."
                  className="w-full border border-[#EDE8E0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FF6A00] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#101214] mb-1">Location</label>
                  <input 
                    required
                    type="text" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full border border-[#EDE8E0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#101214] mb-1">Duration</label>
                  <input 
                    required
                    type="text" 
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="e.g. 3 Months"
                    className="w-full border border-[#EDE8E0] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 py-3 bg-[#F5F3EF] text-[#101214] font-semibold rounded-xl hover:bg-[#EDE8E0] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#FF6A00] text-white font-semibold rounded-xl hover:bg-[#e55f00] transition-colors"
                >
                  Post Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
