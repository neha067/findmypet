"use client"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import PostCard from "@/components/PostCard"
import Login from "@/app/login/page"
import VisitCounter from "@/components/VisitCounter"

export default function Home() {
   return (
    <div className="w-full mx-auto">
      {/* <h1 className="text-2xl font-bold mb-4">onlyCats :3 <VisitCounter /></h1> */}
      <Login />
    </div>
  )
}
