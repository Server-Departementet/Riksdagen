import Image from "next/image";



const loginButton =
    <div className="flex flex-row items-center justify-center gap-x-2 px-3 py-2 bg-[#5865f2] text-white rounded-lg font-bold no-underline hover:text-white hover:drop-shadow-lg cursor-pointer">
        <Image width={24} height={24} src="/icons/discord-mark-white.svg" alt="Discord"></Image>
        Login
    </div>;

export { loginButton };