import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useState } from "react";

interface AutoClosePopoverProps {
  text: string;
  triggerElement: React.ReactElement;
  onTriggerClick?: () => void; // custom function
}

const AutoClosePopover = ({
  text,
  triggerElement,
  onTriggerClick,
}: AutoClosePopoverProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    onTriggerClick?.();
    setIsPopoverOpen(true);
    setTimeout(() => {
      setIsPopoverOpen(false);
    }, 600);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        {React.cloneElement(triggerElement, {
          onClick: handleTriggerClick,
        })}
      </PopoverTrigger>

      <PopoverContent className="w-auto px-2 py-1 bg-green-400">
        {text}
      </PopoverContent>
    </Popover>
  );
};

export default AutoClosePopover;
