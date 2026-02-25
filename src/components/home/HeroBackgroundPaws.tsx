import pawsImg from "../../assets/paws.svg";

interface PawIconProps {
    className?: string;
}

function PawIcon({ className = "" }: PawIconProps) {
    return (
        <img
            src={pawsImg}
            alt="Paw background pattern"
            className={className}
        />
    );
}

export function HeroBackgroundPaws() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* 
        Placing paws matching the Figma scatter pattern:
        They drift from top-right down towards the bottom-right.
      */}

            {/* Top right cluster */}
            <PawIcon className="absolute w-[180px] h-[180px] -top-10 right-40 rotate-[15deg] opacity-[0.12]" />
            <PawIcon className="absolute w-[140px] h-[140px] top-6 right-10 rotate-[-10deg] opacity-[0.25]" />

            {/* Mid right cluster */}
            <PawIcon className="absolute w-[150px] h-[150px] top-32 right-[22rem] rotate-[5deg] opacity-[0.15]" />
            <PawIcon className="absolute w-[120px] h-[120px] top-44 right-48 rotate-[-15deg] opacity-[0.1]" />
            <PawIcon className="absolute w-[160px] h-[160px] top-56 right-12 rotate-[25deg] opacity-[0.2]" />

            {/* Bottom right cluster */}
            <PawIcon className="absolute w-[140px] h-[140px] top-72 right-56 rotate-[5deg] opacity-[0.15]" />
            <PawIcon className="absolute w-[130px] h-[130px] top-96 right-20 rotate-[-5deg] opacity-[0.1]" />
            <PawIcon className="absolute w-[180px] h-[180px] top-80 -right-16 rotate-[35deg] opacity-[0.08]" />
        </div>
    );
}
