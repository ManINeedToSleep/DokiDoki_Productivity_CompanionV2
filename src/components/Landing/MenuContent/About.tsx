"use client";

import Image from "next/image";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import Card from "@/components/Common/Card/LandingCard";

export default function About() {
  return (
    <Card>
      <div className="space-y-6">
        <h2 className="text-3xl font-[Riffic] text-pink-600 mb-4">About Doki Doki Productivity</h2>
        
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-lg mb-4 text-pink-800">
              Welcome to Doki Doki Version 2, a productivity app with a charming Doki Doki theme! 
              Stay organized and motivated with your cute companion by your side.
            </p>
            
            <h3 className="text-xl font-[Riffic] text-pink-600 mb-2">Our Inspiration</h3>
            <p className="mb-4 text-pink-800">
              Inspired by the beloved Doki Doki aesthetic, we&apos;ve created a productivity tool that makes 
              getting things done more enjoyable. The cute characters and pleasant design help make 
              your daily tasks feel less like work and more like fun!
            </p>
          </div>
          
          <div className="relative w-full h-48 my-2">
            <Image
              src={imagePaths.backgrounds.menuOption}
              alt="Doki Doki Productivity"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div>
            <h3 className="text-xl font-[Riffic] text-pink-600 mb-2">Features</h3>
            <ul className="list-disc pl-5 mb-4 text-pink-800">
              <li>Task management with cute companions cheering you on</li>
              <li>Calendar and scheduling with visual reminders</li>
              <li>Note-taking with customizable themes</li>
              <li>Progress tracking and productivity insights</li>
              <li>Customizable workspace settings</li>
            </ul>
            
            <div className="bg-pink-100 rounded-lg p-4 my-4">
              <h3 className="text-xl font-[Riffic] text-pink-600 mb-2 text-center">How It Works</h3>
              <p className="text-pink-800 text-center">
                Organize your tasks, set deadlines, and track your progress while enjoying the 
                company of your favorite character. Stay motivated with encouraging messages and 
                celebrate your productivity wins!
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-pink-300">
          <h3 className="text-xl font-[Riffic] text-pink-600 mb-2">Why Doki Doki?</h3>
          <p className="text-pink-800">
            We believe productivity tools don&apos;t have to be boring! By combining the charm of 
            Doki Doki with powerful productivity features, we&apos;ve created an app that makes 
            organization enjoyable and keeps you coming back to get things done.
          </p>
          
          <div className="mt-4 text-center">
          </div>
        </div>
      </div>
    </Card>
  );
}
