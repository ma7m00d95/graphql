import { useEffect, useMemo, useState } from 'react';
import { FetchData, fetchAuditRatio, RatioComponent } from '../services/FetchGrades.jsx';
import { FetchUser } from '../services/FetchUserDetails.js';
import { FetchMembers, MembersComponent } from '../services/FetchMembers.jsx';
import { FetchUsersByCohort, UserLevelChart } from '../services/FetchUsersByCohort.jsx';
import { fetchSkills, SkillsRadarChart } from '../components/Skill.jsx';

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
        const response = await FetchUsersByCohort(763);
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
    <div data-theme="retro" className="dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">
          Welcome back, <span className="text-primary-focus">{userInfo?.attrs?.firstName}</span> 👋
        </h1>
        <p className="opacity-70 text-sm">
          Hope you're having a productive day!
        </p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cohort levels */}
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">
          {chartData.length > 0 && (
            <UserLevelChart data={chartData} userLevel={myCohortLevel} />
          )}
        </div>

        {/* Skills */}
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">
          {Array.isArray(skillsInfo) && skillsInfo.length > 0 ? (
            <SkillsRadarChart skills={skillsInfo} />
          ) : (
            <p className="text-center opacity-50 italic">No skills loaded yet.</p>
          )}
        </div>

        {/* Members */}
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1 h-[520px]">
          {Array.isArray(membersInfo) && membersInfo.length > 0 ? (
            <MembersComponent members={membersInfo} />
          ) : (
            <p className="text-center opacity-50 italic">No members loaded yet.</p>
          )}
        </div>

        {/* Projects & Grades (actually XP-based projects list) */}
        <div className="card bg-base-100 shadow-xl border border-base-content/10 md:col-span-1">
          {Array.isArray(membersInfo) && membersInfo.length > 0 ? (
            <RatioComponent ratio={projectsInfo}
              audit={audit}
              recentCount={recentCount} />
          ) : (
            <p className="text-center opacity-50 italic">No members loaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;