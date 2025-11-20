import axios from "axios";
//const apiUrl = process.env.NEXT_PUBLIC_BACK_API_LOCAL_URL;
const apiUrl = process.env.NEXT_PUBLIC_BACK_API_URL;
const AuthorizationName = process.env.NEXT_PUBLIC_AUTHORIZATION_NAME;
const AuthorizationPassword = process.env.NEXT_PUBLIC_AUTHORIZATION_PASSWORD;

const getGameCompleted = async (loginId: string) => {
  const res = await axios.get(`${apiUrl}/privacy`, {
    headers: {
      "login-id": loginId,
      Authorization: `Basic ${btoa(
        `${AuthorizationName}:${AuthorizationPassword}`
      )}`,
      type: "accomplishment",
    },
  });
  return res;
};

const patchCompletedGame = async (
  loginId: string,
  index: number,
  completed: boolean,
  coin: number,
) => {
  console.log(apiUrl);
  const res = await axios.patch(
    `${apiUrl}/privacy`,
    { 
        index: index,
        completed: completed,
        coin: coin,
    },
    {
      headers: {
        "login-id": loginId,
        "Authorization": `Basic ${btoa(
          `${AuthorizationName}:${AuthorizationPassword}`
        )}`,
        type: "game-completed",
      },
    }
  );
  return res;
};

export { getGameCompleted, patchCompletedGame };
