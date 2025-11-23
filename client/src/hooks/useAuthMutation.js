import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const useAuthMutation = (mutationFn, { onSuccess, ...options } = {}) => {
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      if (data?.ok && data.accessToken && data.user) {
        setAuthData(data.accessToken, data.user);
      }
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};
