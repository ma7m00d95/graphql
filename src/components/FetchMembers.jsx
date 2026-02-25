import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

const CAPTAIN_MEMBER = gql`
query GetGroupsByUser($userId: Int!) {
  transaction(
    where: {
      _or: [
        {
          progress: {
            group: {
              captain: { id: { _eq: $userId } }
            }
          }
        },
        {
          progress: {
            group: {
              members: {
                user: { id: { _eq: $userId } }
              }
            }
          }
        }
      ]
    }
  ) {
    progress {
      group {
        id
        captain {
          id
          login
          firstName
        }
        members {
          user {
            id
            login
            firstName
            lastName
          }
        }
      }
      object {
        name
      }
    }
  }
}
`

export const FetchMembers = async (userId) => {
  const token = localStorage.getItem('token');

  if (!token || !userId) {
    console.log("Waiting for userId...");
    return { transaction: [] }; // prevent crash
  }

   return request(
    GQL_URL,
    CAPTAIN_MEMBER,
    { userId },
    { Authorization: `Bearer ${token}` }
  );
};



export const MembersComponent = ({ members = [] }) => {

  return (
    <div className="card-body p-4 items-center">

      <h2 className="card-title text-primary tracking-tighter uppercase text-xl font-black mb-2">
        Groups Members
      </h2>

      {/* Scrollable table area */}
      <div className="border border-base-300 rounded-box flex-1 min-h-0 max-h-70 overflow-hidden">
        <div className="h-full flex flex-col min-h-0 ">
          {/* Sticky header */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full table-fixed">

              <thead className="sticky top-0 z-10 bg-base-100">
                <tr>
                  <th>id</th>
                  <th>Project</th>
                  <th>members</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <table className="table table-zebra w-full table-fixed">

              <tbody>
                {members && members.length > 0 ? (
                  members.map((trans, tIndex) => {
                    const group = trans.progress?.group;
                    const project = trans.progress?.object;
                    if (!group) return null;

                    const memberNames = group.members
                      .map((m) => `${m.user.firstName} ${m.user.lastName}`)
                      .join(', ');

                    return (
                      <tr key={group.id || tIndex}>
                        <th className="opacity-50">{tIndex + 1}</th>
                        <td className="truncate">{project?.name || 'N/A'}</td>
                        <td className="text-primary break-words whitespace-normal">
                          {memberNames}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center italic opacity-50">
                      No projects loaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};