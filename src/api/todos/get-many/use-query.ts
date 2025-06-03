import axios from "axios";
import { createQueryHook } from "../../..";
import { GetTodos } from ".";

export const useTodosQuery = createQueryHook<null, GetTodos.TOutput, GetTodos.TParams>({
    url: () => GetTodos.url,
    queryFn: async ({ axiosConfig, params }) => {
        // Params are typed

        const response = await axios<GetTodos.TOutput>(axiosConfig);
        return response.data;
    },
});
