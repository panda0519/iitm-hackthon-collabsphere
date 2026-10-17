import { useCountUp } from "../../hooks/useCountUp.js";

export function Counter({ value, suffix = "" }) {
  const v = useCountUp(value);
  return (
    <>
      {v.toLocaleString("en-IN")}
      {suffix}
    </>
  );
}
