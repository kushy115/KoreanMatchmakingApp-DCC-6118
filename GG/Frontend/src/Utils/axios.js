import axios from 'axios';

const instance = axios.create({
    //baseURL: process.env.REACT_APP_BACKEND_URL,
//    withCredentials: true
    baseURL: 'http://localhost:8080',
});

instance.interceptors.response.use(
    (response) => {
        const{data} = response;
        return response.data;

    }

)

export default instance;