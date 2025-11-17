import axios from "axios";
//const apiUrl = process.env.NEXT_PUBLIC_BACK_API_LOCAL_URL;
const apiUrl = process.env.NEXT_PUBLIC_BACK_API_URL;
const AuthorizationName = process.env.NEXT_PUBLIC_AUTHORIZATION_NAME;
const AuthorizationPassword = process.env.NEXT_PUBLIC_AUTHORIZATION_PASSWORD;

const getGameCompleted = async (loginId: string) => {
  console.log(apiUrl);
  const res = await axios.get(`${apiUrl}/game-complete`, {
    headers: {
      "login-id": loginId,
      Authorization: `Basic ${btoa(
        `${AuthorizationName}:${AuthorizationPassword}`
      )}`,
    },
  });
  return res;
};

const patchCompletedGame = async (
  loginId: string,
  index: number,
  completed: boolean
) => {
  console.log(apiUrl);
  const res = await axios.patch(
    `${apiUrl}/game-complete`,
    { 
        index: index,
        completed: completed,
    },
    {
      headers: {
        "login-id": loginId,
        "Authorization": `Basic ${btoa(
          `${AuthorizationName}:${AuthorizationPassword}`
        )}`,
      },
    }
  );
  return res;
};

export { getGameCompleted, patchCompletedGame };
