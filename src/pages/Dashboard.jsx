import { useState } from 'react'
import { FetchData } from '../services/FetchGrades.js'
import { FetchRatio } from '../services/FetchRatio.js'
import { FetchUser } from '../services/FetchUserDetails.js'
import { FetchMembers } from '../services/FetchMembers.js';
import { FetchUsersByCohort, UserLevelChart } from '../services/FetchUsersByCohort.jsx';
import { fetchSkills, SkillsRadarChart } from '../components/Skill.jsx'


import '../styles/Dashboard.css'
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

function Dashboard() {

  const [userInfo, setUserInfo] = useState(null)
  const [projectsInfo, setProjectsInfo] = useState([]);
const [recentCount, setRecentCount] = useState(0);
  const [isDone, setIsDone] = useState(true)
  const [limit, setLimit] = useState(5)
  const [orderBy, setOrderBy] = useState("asc")
  const [dates, setDates] = useState({ from: '', to: '' });
  const [maxInfo, setMaxInfo] = useState('Loading...')
  const [membersInfo, setMembersInfo] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
const [percentage, setPercentage] = useState(0);
const [unpercentage, setUnPercentage] = useState(0);
  const [chartData, setChartData] = useState([]);
  // 1. Add state to Dashboard.jsx
  const [myCohortLevel, setMyCohortLevel] = useState(null);

  const [skillsInfo, setSkillsInfo] = useState(null)
  // 2. Function to handle the change
  const handleSortChange = (event) => {
    setOrderBy(event.target.value);
  };
  const handleDoneChange = (event) => {
    setIsDone(event.target.value);
  };

  // ************************ Start ************************
  const getUserDetails = () => {
    FetchUser().then(data => {
      setUserInfo({ ...data.user[0] });
    }).catch(err => {
      console.error("Failed to fetch user:", err);
    });

  }
  if (userInfo === null) {
    getUserDetails();
  }
  // *******************************************************
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...(projectsInfo || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
  const getLatestProjects = async () => {
    try {
      const data = await FetchData();
      // Manually extract and format the data
      const formattedProjects = data?.progress?.map((item) => ({
        name: item.object.name,
        status: (item.isDone && item.grade !== null) ? "Completed" : "Not Passed",
        count: item.object.progresses_aggregate.aggregate.count,
        grade: (item.grade === null) ? "No Grade" : item.grade,
        lastAttempt: new Date(item.updatedAt).toLocaleDateString(),
        rawDate: new Date(item.updatedAt).getTime(),
      })) || []; // <--- Ensure these closing symbols are here

    // Build stats properly
    const completedCount = formattedProjects.filter(p => p.status === "Completed").length;
    const unCompletedCount = formattedProjects.filter(p => p.status === "Not Passed").length;
// Define the 90-day threshold (90 days * 24h * 60m * 60s * 1000ms)
const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

// Filter projects where the rawDate is greater than the threshold

const recentCount = formattedProjects.filter(p => p.rawDate >= ninetyDaysAgo).length;

// Update your state
setRecentCount(recentCount); 

    const stats = {
      completed: completedCount,
      unCompleted: unCompletedCount,
      total: formattedProjects.length,
    };

    const CompletedPercent = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;
    const UnCompletedPercent = stats.total > 0
      ? Math.round((stats.unCompleted / stats.total) * 100)
      : 0;

    setProjectsInfo(formattedProjects);
    setPercentage(CompletedPercent);
    setUnPercentage(UnCompletedPercent);

    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjectsInfo([]); // Clear or set to an error state as needed  
    }
  }
  if (projectsInfo.length === 0) {
    getLatestProjects();
  }
  const getProject = async (e) => {

    if (e.target.name === 'max' && dates.from === '' || dates.to === '') {
      return
    }
    const data = await FetchRatio(dates.from, dates.to);
    setMaxInfo(data)
  }
  const getCohortUsers = async () => {
    try {

      const response = await FetchUsersByCohort(parseInt(763));

      const eventUsers = response.event_user || [];

      // 1. Get your username from storage
      const myUsername = localStorage.getItem('username');

      // 2. Find YOUR specific level in this cohort's data
      const myEntry = eventUsers.find(u => u.userLogin === myUsername);
      setMyCohortLevel(myEntry ? myEntry.level : null);

      // 3. Process the counts for the bars (as before)
      const counts = eventUsers.reduce((acc, curr) => {
        acc[curr.level] = (acc[curr.level] || 0) + 1;
        return acc;
      }, {});

      const processed = Object.keys(counts)
        .map(lvl => ({
          level: parseInt(lvl),
          count: counts[lvl]
        }))
        .sort((a, b) => a.level - b.level);

      setChartData(processed);
    } catch (err) {
      console.error("Failed to fetch levels:", err);
    }
  };

  if (chartData.length === 0) {
    getCohortUsers();
  }
  const getMembers = async () => {
    const data = await FetchMembers(); // 1. Get fresh data
    // 2. Reduce the 'transaction' array FROM the fresh data
    const uniqueList = data?.transaction?.reduce((acc, current) => {
      const groupId = current.progress?.group?.id;
      // If we haven't added this group ID yet, add it to the accumulator
      if (groupId && !acc.find(item => item.progress?.group?.id === groupId)) {
        acc.push(current);
      }
      return acc;
    }, []);
    // 3. Set the state to match the expected structure: { transaction: [...] }
    setMembersInfo({ transaction: uniqueList });
  }
  if (membersInfo === null) {
    getMembers();
  }
  const getSkills = async () => {
    const data = await fetchSkills(); // 1. Get fresh data
    setSkillsInfo(data);
  }
  if (skillsInfo === null) {
    getSkills();
  }
  return (
    <div data-theme="retro" className="min-h-screen p-8 bg-base-300">
      <div className="grid text-sm">
        <span className="opacity-80">Welcome Back {userInfo?.attrs?.firstName} {userInfo?.attrs?.lastName}</span>
      </div >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">

          {chartData.length > 0 && (
            <UserLevelChart data={chartData} userLevel={myCohortLevel} />
          )}

        </div>
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">
          {Array.isArray(skillsInfo) && skillsInfo.length > 0 ? (
            <SkillsRadarChart skills={skillsInfo} />
          ) : (
            <p className="text-center opacity-50 italic">No skills loaded yet.</p>
          )}
        </div>
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">
          <div className="card-body">
            <h2 className="card-title text-primary underline decoration-primary">Pass and Fail Ratio</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="opacity-80">From:</span> <span className="input"><input value={dates.from} onChange={(e) => { setDates({ ...dates, from: e.target.value }) }} type='date' /></span>
              <span className="opacity-80">to:</span> <span className="input"><input value={dates.to} onChange={(e) => setDates({ ...dates, to: e.target.value })} type='date' /></span>
            </div>
            <button name='max' onClick={(e) => getProject(e)} className="btn btn-accent btn-sm mt-2">get ratio</button>
            <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-box border border-base-300">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Created At</th>
                    <th>Bonus Type</th>
                  </tr>
                </thead>
                <tbody>
                  {maxInfo?.transaction?.map((item, index) => (
                    <tr key={index}>
                      <td className="font-bold text-primary">{item.amount}</td>
                      <td>{item.createdAt.split('T')[0]}</td>
                      <td>
                        <div className="badge badge-ghost font-mono">
                          {item.isBonus ? "Bonus" : "Regular"}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!maxInfo && <tr><td colSpan="3" className="text-center italic opacity-50">No projects loaded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">
          <div className="card-body">
            <h2 className="card-title text-primary underline decoration-primary">members of the group</h2>
            <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-box border border-base-300">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>id</th>
                    <th>Project</th>
                    <th>members</th>
                  </tr>
                </thead>
                <tbody>
                  {membersInfo?.transaction?.map((trans, tIndex) => {
                    const group = trans.progress?.group;
                    const project = trans.progress?.object;
                    if (!group) return null; // Skip if there's no group dat
                    // 1. Combine all member names into one string separated by a comma
                    const memberNames = group.members
                      .map(m => `${m.user.firstName} ${m.user.lastName}`)
                      .join(', ');
                    return (
                      <tr key={tIndex}>
                        {/* ID: Using the index or a unique ID from the data if available */}
                        <th className="opacity-50">{tIndex + 1}</th>
                        {/* Project Name */}
                        <td className="badge badge-ghost mt-3">{project?.name || 'N/A'}</td>
                        {/* Combined Members List */}
                        <td className="font-bold text-primary max-w-xs whitespace-normal">
                          {memberNames}
                        </td>
                      </tr>
                    );
                  })}
                  {(!membersInfo?.transaction || membersInfo.transaction.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center italic opacity-50">
                        No projects loaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">
          <div className="card-body">
            <h2 className="card-title text-primary underline decoration-primary">Projects & Grades</h2>

            <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-box border border-base-300">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="cursor-pointer select-none">
                    <th onClick={() => requestSort('name')}>Project Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('status')}>Results {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('count')}>Attempts {sortConfig.key === 'count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('grade')}>Grade {sortConfig.key === 'grade' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => requestSort('rawDate')}>
                      Last Attempt {sortConfig.key === 'rawDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length > 0 ? (
                    sortedData.map((item, index) => (
                      <tr key={index}>
                        <td className="font-bold text-primary">{item.name}</td>
                        <td>{item.status}</td>
                        <td className="font-bold text-primary">{item.count}</td>
                        <td><span className="badge badge-ghost font-mono">{item.grade}</span></td>
                        <td><span className="badge badge-ghost font-mono">{item.lastAttempt}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center italic opacity-50">
                        No projects loaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
            </div>
            
            <div className="stats shadow">
<div 
 className="radial-progress bg-primary text-primary-content border-primary border-4 gap-3"
  style={{ "--value": percentage }} 
  role="progressbar"
>
  {percentage}%
</div>
<div 
  className="radial-progress bg-primary text-primary-content border-primary border-4"
  style={{ "--value": unpercentage }} 
  role="progressbar"
>
  {unpercentage}%
</div>
<div className="stats shadow border border-base-content/10">
  <div className="stat">
    <div className="stat-title text-primary font-bold">Total Projects</div>
    <div className="stat-value text-primary">{sortedData.length}</div>
    <div className="stat-desc font-medium">
      <span className="text-amber-700 font-bold font-">{recentCount}</span> projects in the last <span className="text-amber-700 font-bold">90</span> days
    </div>
  </div>
</div>
</div>
          </div>
        </div>
      </div>
    </div>

  )
}

export default Dashboard
