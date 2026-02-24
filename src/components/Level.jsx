import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';


const GET_SKILLS = gql`
query {
  user {
    transactions(
      where: { type: { _like: "skill_%" } }
      order_by: [{ type: desc }, { createdAt: desc }]
      distinct_on: [type]
    ) {
      type
      amount
    }
  }
}
`;

export const fetchSkills = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Missing auth token');

  console.log("call The Skills API");
  const data = await request(GQL_URL, GET_SKILLS, {}, {
    Authorization: `Bearer ${token}`
  });

  // Return the actual transactions array
  return data?.user[0]?.transactions || [];

}
export const SkillsRadarChart = ({ skills = [] }) => {
  if (skills.length === 0) return null;

  const size = 350;
  const center = size / 2;
  const maxRadius = size * 0.38;
  const minRadius = 15; // Prevents points from bunching at the 0 center
  const totalAxes = skills.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  const getCoordinates = (amount, i, customRadius = null) => {
    // Maps 0-100 to [minRadius, maxRadius]
    const r = customRadius ?? (minRadius + (maxRadius - minRadius) * (amount / 100));
    const x = center + r * Math.sin(i * angleStep);
    const y = center - r * Math.cos(i * angleStep);
    return { x, y };
  };

  const points = skills.map((s, i) => {
    const { x, y } = getCoordinates(s.amount, i);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="card-body p-4 items-center">
      <h2 className="card-title text-primary tracking-tighter uppercase text-xl font-black mb-2">
        Skills Map
      </h2>

      <div className="w-md aspect-square flex justify-center items-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="overflow-visible w-md h-md">
          {/* 1. Grid Rings */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((r) => (
            <circle
              key={r} cx={center} cy={center}
              r={minRadius + (maxRadius - minRadius) * r}
              fill="none" className="stroke-base-content opacity-10"
            />
          ))}

          {/* 2. Axes and Labels */}
          {skills.map((skill, i) => {
            const outer = getCoordinates(100, i, maxRadius);
            const labelPos = getCoordinates(100, i, maxRadius + 25);
            const label = skill.type.replace('skill_', '').toUpperCase();

            return (
              <g key={i}>
                <line x1={center} y1={center} x2={outer.x} y2={outer.y} className="stroke-base-content opacity-10" />
                <text
                  x={labelPos.x} y={labelPos.y}
                  className="fill-base-content font-mono text-[10px] font-bold"
                  textAnchor="middle" dominantBaseline="middle"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* 3. The Radar Area */}
          <polygon
            points={points}
            className="fill-primary opacity-20 stroke-primary"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* 4. Interactive Points */}
          {skills.map((skill, i) => {
            const { x, y } = getCoordinates(skill.amount, i);
            return (
              <g key={i} className="group cursor-pointer">
                {/* Invisible larger hit area for easier hovering */}
                <circle cx={x} cy={y} r="10" fill="transparent" />

                <circle
                  cx={x} cy={y} r="4"
                  className="fill-primary stroke-base-100 transition-all duration-200 group-hover:r-6"
                  strokeWidth="2"
                />

                {/* Percentage Tooltip */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect
                    x={x - 15} y={y - 25} width="30" height="18" rx="4"
                    className="fill-base-content"
                  />
                  <text
                    x={x} y={y - 13}
                    className="fill-base-100 text-[9px] font-bold"
                    textAnchor="middle"
                  >
                    {skill.amount}%
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>

  );
};
