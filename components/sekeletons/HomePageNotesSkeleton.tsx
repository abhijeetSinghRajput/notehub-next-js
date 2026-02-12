import React from 'react'
import { Skeleton } from '../ui/skeleton'

const HomePageNotesSkeleton = () => {
  let collectionLength = localStorage.getItem("collectionLength");
  const parsedLength = collectionLength ? (JSON.parse(collectionLength) as unknown[]).length : 0;

  const skeletons = [];
  for (let i = 0; i < parsedLength && i < 10; ++i) {
    skeletons.push(<Skeleton key={i} className="h-28" />);
  }
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {skeletons}
    </div>
  )
}

export default HomePageNotesSkeleton