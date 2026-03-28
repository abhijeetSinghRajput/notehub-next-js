import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SidebarSkeleton = () => {
  const storedLength = localStorage.getItem("collectionLength");
  const collectionLength = storedLength ? JSON.parse(storedLength) : [];
  return (
    <div className="h-full pt-8 w-full p-2">
      {Array(collectionLength)
        .fill(null)
        .map((length, index) => (
          <div key={index} className="">
            <Skeleton className={"w-full h-7 mb-3"} />
          </div>
        ))}
    </div>
  );
};

export default SidebarSkeleton;
