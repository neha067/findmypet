import { AppWindowIcon, CodeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/components/ui/MapView.jsx"), {
  ssr: false,
});
import Social from "@/app/Social/page.tsx"

const TabsNav = ({map_center,filteredData}) => {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Map Explorer</TabsTrigger>
          <TabsTrigger value="password">Home</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <div>
          <p>hi</p>
          <MapView 
            map_center={map_center}
            catData={filteredData}
            />
          </div>
        </TabsContent>
        <TabsContent value="password">
         <Social />
        </TabsContent>
      </Tabs>
    </div>
  )
}
export default TabsNav;
