import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { DocPage } from "./pages/DocPage";
import { IndexPage } from "./pages/IndexPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { lectures, projects, skills, references } from "./content";

const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const lecturesIndex = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lectures",
  component: () => (
    <IndexPage
      title="Lectures — Bài giảng nền tảng"
      subtitle="13 bài học vì sao AI agent fail và cách harness fix nó."
      items={lectures}
      basePath="/lectures"
    />
  ),
});

const lectureDetail = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lectures/$slug",
  component: () => <DocPage collection={lectures} basePath="/lectures" />,
});

const projectsIndex = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: () => (
    <IndexPage
      title="Projects — Thực hành tay"
      subtitle="Bài tập dẫn dắt từng bước. Build workflow agent thực tế."
      items={projects}
      basePath="/projects"
    />
  ),
});

const projectDetail = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$slug",
  component: () => <DocPage collection={projects} basePath="/projects" />,
});

const skillsIndex = createRoute({
  getParentRoute: () => rootRoute,
  path: "/skills",
  component: () => (
    <IndexPage
      title="Skills — Kỹ năng harness"
      subtitle="Các module kỹ năng tiêu chuẩn giúp định hình và kiểm soát hành vi của AI Agent."
      items={skills}
      basePath="/skills"
    />
  ),
});

const skillDetail = createRoute({
  getParentRoute: () => rootRoute,
  path: "/skills/$slug",
  component: () => <DocPage collection={skills} basePath="/skills" />,
});

const referencesIndex = createRoute({
  getParentRoute: () => rootRoute,
  path: "/references",
  component: () => (
    <IndexPage
      title="References — Tài liệu mở rộng"
      subtitle="Docs, paper, MCP server, link cộng đồng."
      items={references}
      basePath="/references"
    />
  ),
});

const referenceDetail = createRoute({
  getParentRoute: () => rootRoute,
  path: "/references/$slug",
  component: () => <DocPage collection={references} basePath="/references" />,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  lecturesIndex,
  lectureDetail,
  projectsIndex,
  projectDetail,
  skillsIndex,
  skillDetail,
  referencesIndex,
  referenceDetail,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});
