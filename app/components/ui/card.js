import React from "react";

export default function Card({children,className,noPadding=false,...props}){
    return(
        <div className={`bg-card rounded-xl border border-border shadow-sm  ${className || ''}`} {...props}> 
        <div className={noPadding? "": "p-4 sm:p-6"}>{children}</div></div>
    )
}