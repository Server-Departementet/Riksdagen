import Image from "next/image";

const loginButton =
    <div tabIndex={0} className="flex flex-row items-center justify-center gap-x-2 px-3 py-2 bg-[#5865f2] text-white rounded-lg font-bold no-underline hover:text-white hover:drop-shadow-lg cursor-pointer">
        <Image width={24} height={24} src="/icons/discord-mark-white.svg" alt="Discord"></Image>
        Login
    </div>;

const userButtonSkeleton = <div className="flex flex-row items-center gap-3 me-1">
    {/* Name */}
    <div className="bg-gray-700 w-[10ch] h-[1rem] rounded-sm"></div>
    {/* Avatar */}
    <div className="bg-gray-700 size-10 rounded-full"></div>
</div>;

export { loginButton, userButtonSkeleton };