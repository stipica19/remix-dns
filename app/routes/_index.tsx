import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Dinio" },
    { name: "description", content: "Welcome to Dinio!" },
  ];
};

export default function Index() {
  return <div>Hello</div>;
}
