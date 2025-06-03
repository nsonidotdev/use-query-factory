import axios from "axios";
import { GetOneTodo } from ".";
import { createQueryHook } from "../../..";


export const useTodoQuery = createQueryHook<GetOneTodo.TInput, GetOneTodo.TOutput, GetOneTodo.TParams>({
    url: ({slug}) =>  GetOneTodo.url(slug),
    defaultParams: {
        verbose: true
    },
    queryFn: async ({ axiosConfig, input, params }) => {
        // Input type is as defined

        const response = await axios<GetOneTodo.TOutput>({
            ...axiosConfig,
            params: {
                // Params have correct type
                verbose: params?.verbose ? '1' : '0',
            }
        });

        return response.data;
    }
});
