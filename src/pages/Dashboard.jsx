import { useEffect, useMemo, useState } from 'react';
import { FetchData, fetchAuditRatio, GradeComponent } from '../components/FetchGrades.jsx';
import { RatioComponent } from '../components/FetchRatio.jsx';
import { FetchUser } from '../services/FetchUserDetails.js';
import { FetchMembers, MembersComponent } from '../components/FetchMembers.jsx';
import { FetchUsersByCohort, UserLevelChart } from '../components/FetchUsersByCohort.jsx';
import { fetchSkills, SkillsRadarChart } from '../components/Skill.jsx';
import { FetchMyCohort } from '../services/FetchCohort.js';

import '../styles/Dashboard.css';

function Dashboard() {
  
  const [userInfo, setUserInfo] = useState(null);
  const [projectsInfo, setProjectsInfo] = useState([]);
  const [recentCount, setRecentCount] = useState(0);

  const [membersInfo, setMembersInfo] = useState(null);

  const [chartData, setChartData] = useState([]);
  const [myCohortLevel, setMyCohortLevel] = useState(null);
  const [skillsInfo, setSkillsInfo] = useState([]);

  // New: audit stats
  const [audit, setAudit] = useState({ auditRatio: 0, totalUp: 0, totalDown: 0 });

    const Logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('savedDate');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');

    window.location.href = '/login'; // Redirects and reloads the page

  };
//  useEffect(() => {
//   const savedDate = localStorage.getItem("savedDate");

//   const expired =
//     !savedDate ||
//     Date.now() - new Date(savedDate).getTime() > 60 * 60 * 1000;

//   if (expired) {
//     Logout();
//   }
// }, []);


  // ---------- Effects (no side effects in render) ----------
  useEffect(() => {
    async function loadUser() {
      try {
        const data = await FetchUser();
        setUserInfo({ ...data.user[0] });
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function loadXP() {
      try {
        const data = await FetchData();
        const formattedProjects =
          data?.transaction?.map((item) => ({
            name: item.object?.name || 'Unknown Project',
            amountMB: Math.round((item.amount / 1000) * 10) / 10, // MB with 1 decimal
            createdAt: item.createdAt ?? '',
            created: item.createdAt ? item.createdAt.split('T')[0] : '',
            path: item.path || null,
            status: 'Finished', // XP implies completion
          })) || [];

        setProjectsInfo(formattedProjects);
      } catch (err) {
        console.error('Mapping Error:', err);
        setProjectsInfo([]);
      }
    }
    loadXP();
  }, []);

  useEffect(() => {
    async function loadCohort() {
      try {
        const cohort = await FetchMyCohort();

        const response = await FetchUsersByCohort(cohort);
        const eventUsers = response.event_user || [];

        const myUsername = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
        const myEntry = eventUsers.find((u) => u.userLogin === myUsername);
        setMyCohortLevel(myEntry ? myEntry.level : null);

        const counts = eventUsers.reduce((acc, curr) => {
          acc[curr.level] = (acc[curr.level] || 0) + 1;
          return acc;
        }, {});
        const processed = Object.keys(counts)
          .map((lvl) => ({ level: parseInt(lvl, 10), count: counts[lvl] }))
          .sort((a, b) => a.level - b.level);

        setChartData(processed);
      } catch (err) {
        console.error('Failed to fetch levels:', err);
      }
    }
    loadCohort();
  }, []);

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await FetchMembers();

        const uniqueList =
          data?.transaction?.reduce((acc, current) => {
            const groupId = current.progress?.group?.id;
            if (groupId && !acc.find((item) => item.progress?.group?.id === groupId)) {
              acc.push(current);
            }
            return acc;
          }, []) || [];

        setMembersInfo(uniqueList);
      } catch (err) {
        console.error('Failed to fetch members:', err);
        setMembersInfo([]);
      }
    }
    loadMembers();
  }, []);

  useEffect(() => {
    async function loadSkills() {
      try {
        const data = await fetchSkills();
        setSkillsInfo(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch skills:', err);
        setSkillsInfo([]);
      }
    }
    loadSkills();
  }, []);

  useEffect(() => {
    async function loadAudit() {
      try {
        const res = await fetchAuditRatio();
        const u = res?.user?.[0];
        if (u) {
          setAudit({
            auditRatio: Number(u.auditRatio || 0),
            totalUp: Number(u.totalUp || 0),
            totalDown: Number(u.totalDown || 0),
          });
        }
      } catch (e) {
        console.error('Failed to fetch audit ratio', e);
      }
    }
    loadAudit();
  }, []);




  const recentCountCalc = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 90);

    const seen = new Set();
    let count = 0;
    for (const p of projectsInfo) {
      if (!p.createdAt) continue;
      const t = new Date(p.createdAt);
      if (t >= cutoff) {
        const key = p.path ?? `${p.name}|${p.createdAt}`;
        if (!seen.has(key)) {
          seen.add(key);
          count++;
        }
      }
    }
    return count;
  }, [projectsInfo]);

  useEffect(() => {
    setRecentCount(recentCountCalc);
  }, [recentCountCalc]);


  return (
    <div data-theme="abyss" className="min-h-screen bg-base-300">
      {/* 1. Added a wrapper with container, mx-auto, and responsive padding */}
      <div className="container mx-auto max-w-7xl px-4 md:px-10 py-8">

        {/* Top Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Welcome back, <span className="text-primary-focus">{userInfo?.attrs?.firstName}</span> 👋
            </h1>
            <p className="opacity-70 text-sm">
              Hope you're having a productive day!
            </p>
          </div>
          <div className="md:text-right">
            <button className="btn btn-primary btn-wide" type='button' onClick={Logout}>Logout</button>
          </div>
        </div>

        {/* Charts & Content Grid */}
{/* ===== Ratio Row (3 cards) ===== */}
{Array.isArray(membersInfo) && membersInfo.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <RatioComponent
      ratio={projectsInfo}
      audit={audit}
      recentCount={recentCount}
    />
  </div>
)}

{/* ===== Rest of Dashboard (2 cards per row) ===== */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* Cohort levels */}
<div className="card bg-base-100 shadow-xl border border-base-content/10">
  <div className="card-body h-[400px] md:h-[550px]">
    {chartData.length > 0 && (
      <UserLevelChart data={chartData} userLevel={myCohortLevel} />
    )}
  </div>
</div>


  {/* Skills Radar */}
<div className="card bg-base-100 shadow-xl border border-base-content/10">
  <div className="card-body h-[400px] md:h-[550px]">
    {Array.isArray(skillsInfo) && skillsInfo.length > 0 ? (
      <SkillsRadarChart skills={skillsInfo} />
    ) : (
      <p className="p-10 text-center opacity-50 italic">
        No skills loaded yet.
      </p>
    )}
  </div>
  </div>

  {/* Members */}
<div className="card bg-base-100 shadow-xl border border-base-content/10">
  <div className="card-body h-[400px] md:h-[450px]">    
    {Array.isArray(membersInfo) && membersInfo.length > 0 ? (
      <MembersComponent members={membersInfo} />
    ) : (
      <p className="p-10 text-center opacity-50 italic">
        No members loaded yet.
      </p>
    )}
    </div>
  </div>

  {/* Projects */}
<div className="card bg-base-100 shadow-xl border border-base-content/10">
  <div className="card-body h-[400px] md:h-[450px]">    
    {Array.isArray(membersInfo) && membersInfo.length > 0 ? (
      <GradeComponent
        ratio={projectsInfo}
        audit={audit}
        recentCount={recentCount}
      />
    ) : (
      <p className="p-10 text-center opacity-50 italic">
        No members loaded yet.
      </p>
    )}
    </div>
  </div>

</div>

      </div>
    </div>
  );

}

export default Dashboard;