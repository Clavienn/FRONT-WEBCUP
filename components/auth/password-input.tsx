"use client"

import { useState, type ComponentProps } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PasswordInputProps extends Omit<ComponentProps<typeof Input>, "type"> {
  fieldLabel: string
  id: string
}

export function PasswordInput({ className, fieldLabel, id, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useLanguage()
  const Icon = isVisible ? EyeOffIcon : EyeIcon

  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        type={isVisible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={t(isVisible ? "passwordVisibility.hide" : "passwordVisibility.show", { field: fieldLabel })}
        aria-pressed={isVisible}
        aria-controls={id}
        title={t(isVisible ? "passwordVisibility.hide" : "passwordVisibility.show", { field: fieldLabel })}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}