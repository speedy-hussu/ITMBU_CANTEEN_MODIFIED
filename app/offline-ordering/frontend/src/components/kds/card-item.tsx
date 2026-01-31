import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CardItemProps {
  name: string;
  qty: number;
  onCheck: () => void;
  onReject?: () => void;
  disabled?: boolean;
  status?: string;
}

export default function CardItem({
  name,
  qty,
  onCheck,
  onReject,
  disabled,
  status = "PREPARING",
}: CardItemProps) {
  const isRejected = status === "REJECTED";
  const isPrepared = status === "PREPARED";

  return (
    <div
      className={`w-full flex justify-between items-center text-lg mb-0.5 p-1 rounded font-semibold ${isRejected ? "bg-red-100 opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        {!disabled && !isRejected && (
          <Checkbox
            checked={isPrepared}
            onCheckedChange={onCheck}
            className="cursor-pointer"
          />
        )}
        <p
          className={`${isPrepared || isRejected ? "text-gray-400 line-through" : ""}`}
        >
          {name}{" "}
          {isRejected && (
            <span className="ml-2 text-red-600 text-sm italic">(REJECTED)</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p>x{qty}</p>
        {!disabled && !isRejected && onReject && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onReject}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
