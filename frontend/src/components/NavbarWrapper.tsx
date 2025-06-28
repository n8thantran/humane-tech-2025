"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/blocks/Navbar/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  
  // Only show navbar on home page (root path)
  const showNavbar = pathname === '/';

  return showNavbar ? <Navbar /> : null;
} 