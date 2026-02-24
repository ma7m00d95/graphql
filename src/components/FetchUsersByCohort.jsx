import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';
//npm install graphql-request graphql
// const co1 = 20
// const co2 = 72
// const co3 = 250
// const co4 = 763
// const co5 = 1195

const GET_COHORT_Users = gql`
query GetAllMemberLevels($cohort: Int!)  {
  event_user(
    where: { 
      eventId: { _eq: $cohort }, 
      level: { _gt: 0 } 
    }
    order_by: { level: desc }
  ) {
    level
    userLogin
    # Adding the user relationship to get names
    publicUser{
      firstName
      lastName
    }
  }
}
`;
const GET_COHORT = `query GetCohortEventIds {
  event(
    where: { 
      # This removes all the [] results from your list
      cohorts: { id: { _is_null: false } } 
    }
  ) {
    id
    path
    cohorts {
      name
    }
  }
}`;
export const FetchUsersByCohort = async (cohort) => {
  const token = localStorage.getItem('token');

  if (!token) throw new Error('Missing auth token');
  const variables = {
    cohort,
  };
  console.log("Fetch Users By Cohort")

  return request(
    GQL_URL,
    GET_COHORT_Users,
    variables,
    { Authorization: `Bearer ${token}` }
  );

}

export const UserLevelChart = ({ data = [], userLevel }) => {
  if (data.length === 0) return null;

const width = 600;
const height = 400;
  const padding = 60; // Increased padding for labels
  const maxValue = Math.max(...data.map(d => d.count)) || 1;
  const barWidth = (width - padding * 2) / data.length;

  return (
    <div className="card-body p-4 items-center">
      <h2 className="card-title text-primary tracking-tighter uppercase text-xl font-black mb-2">
        Levels
      </h2>

<div className="w-full h-full flex justify-center items-center">
  <svg
    viewBox={`0 0 ${width} ${height}`}
    className="w-full h-full"
    preserveAspectRatio="xMidYMid meet"
  >
          {/* Axis Labels */}
          <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="12" fill="#ffd79a">Level</text>
          <text x={15} y={height / 2} textAnchor="middle" fontSize="12" fill="#ffd79a" transform={`rotate(-90, 15, ${height / 2})`}>Users</text>

          {data.map((item, i) => {
            const barHeight = (item.count / maxValue) * (height - padding * 2);
            const x = padding + i * barWidth;
            const y = height - padding - barHeight;

            const isMyLevel = item.level === userLevel;

            return (
              <g key={item.level}>
                {/* "You are here" label for your level only */}
                {isMyLevel && (
                  <text
                    x={x + (barWidth * 0.45)}
                    y={y - 25}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#ff5700"
                  >
                    YOU
                  </text>
                )}

                <rect
                  x={x}
                  y={y}
                  width={barWidth * 0.8}
                  height={barHeight}
                  fill={isMyLevel ? "#ff5700" : "#85b404"}
                  rx="3"
                />

                <text fill='#ffd79a' x={x + (barWidth * 0.4)} y={height - 40} textAnchor="middle" fontSize="9">{item.level}</text>
                <text fill='#ffd79a' x={x + (barWidth * 0.4)} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold">{item.count}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};