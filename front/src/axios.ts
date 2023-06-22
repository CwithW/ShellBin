import axios from "axios";

let axios1 = axios.create({
    baseURL: import.meta.env.DEV?  "http://localhost:3000/api" : "/api",
});

axios1.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `${token}`;
    }
    return config;
});

axios1.interceptors.response.use((response) => {
    let code = response.data.code;
    if (code === 401) {
        localStorage.removeItem("token");
        window.location.href = "/#/login";
    }
    return response;
});

export default axios1;