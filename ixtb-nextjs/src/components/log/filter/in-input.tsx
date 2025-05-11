import ListPagination from "../../internal/list-pagination";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

export function InInput(props: {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  fieldName: string;
  pageSize: number;
  page: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  total: number;
  isLoading: boolean;
  disabled?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" disabled={props.disabled}>
          {props.value.length ? `${props.value.length} selected` : "Select"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.fieldName}</DialogTitle>
          <DialogDescription>Select a value from the list</DialogDescription>
        </DialogHeader>
        <div>
          {props.options.map((option) => (
            <TooltipProvider key={option}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center space-x-2 bg-muted rounded-md p-2 border border-border">
                    <Checkbox
                      id={option}
                      checked={props.value.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          props.onChange([...props.value, option]);
                        } else {
                          props.onChange(
                            props.value.filter((v) => v !== option)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={option}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 max-w-[200px] truncate"
                    >
                      {option}
                    </label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{option}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <ListPagination
          count={props.total}
          page={props.page}
          pageSize={props.pageSize}
          disabled={props.isLoading}
          setPage={props.setPage}
          setPageSize={props.setPageSize}
          className="py-4"
        />
      </DialogContent>
    </Dialog>
  );
}
