import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
// const host = "https://asr-api.azurewebsites.net/";
const localhost = "http://localhost:5000";
const URL = process.env.NODE_ENV === "production" ? undefined : localhost;

export const socket = io(URL, { autoConnect: false });
