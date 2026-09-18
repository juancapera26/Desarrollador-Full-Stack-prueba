import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "home" },
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login/login.page").then((m) => m.LoginPage),
  },
  {
    path: "register",
    loadComponent: () =>
      import("./pages/register/register.page").then((m) => m.RegisterPage),
  },
  {
    path: "home",
    loadComponent: () =>
      import("./pages/home/home.page").then((m) => m.HomePage),
  },
  {
    path: "cart",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/cart/cart.page").then((m) => m.CartPage),
  },
  {
    path: "checkout",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/checkout/checkout.page").then((m) => m.CheckoutPage),
  },
  {
    path: "points",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/points/points.page").then((m) => m.PointsPage),
  },
  { path: "**", redirectTo: "login" },
];
