import { cn } from "@/src/lib/utils.ts";
import { ILog } from "fmdx-core/definitions/log";
import { useState } from "react";
import { Badge } from "../ui/badge.tsx";
import { Skeleton } from "../ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.tsx";
import { LogSheet } from "./log-sheet.tsx";

export interface ILogsTableProps {
  logs: ILog[];
  className?: string;
}

export function LogsTableRow(props: { log: ILog }) {
  const { log } = props;
  const timestamp = log.createdAt.toLocaleString();
  const level = log.data.level ?? "unknown";
  const message = log.data.message ?? "unknown";

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <LogSheet log={log} isOpen={isOpen} onOpenChange={setIsOpen} />
      )}
      <TableRow
        key={log.id}
        className="curspr-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <TableCell className="w-[100px] pl-4 text-muted-foreground cursor-pointer">
          {timestamp}
        </TableCell>
        <TableCell className="w-[100px] cursor-pointer">
          <Badge variant="outline">{level}</Badge>
        </TableCell>
        <TableCell className="pr-4 cursor-pointer">{message}</TableCell>
      </TableRow>
    </>
  );
}

export function LogsTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-[100px] pl-4">
        <Skeleton className="w-full h-4" />
      </TableCell>
      <TableCell className="w-[100px]">
        <Skeleton className="w-full h-4" />
      </TableCell>
      <TableCell className="pr-4">
        <Skeleton className="w-full h-4" />
      </TableCell>
    </TableRow>
  );
}

export function LogsTable(props: ILogsTableProps) {
  return (
    <Table
      className={cn(props.className, "font-(family-name:--font-geist-mono)")}
    >
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px] pl-4 text-muted-foreground">
            Timestamp
          </TableHead>
          <TableHead className="w-[100px]">Level</TableHead>
          <TableHead className="pr-4">Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.logs.map((log) => {
          return <LogsTableRow key={log.id} log={log} />;
        })}
      </TableBody>
    </Table>
  );
}

export function LogsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px] pl-4">Timestamp</TableHead>
          <TableHead className="w-[100px]">Level</TableHead>
          <TableHead className="pr-4">Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <LogsTableRowSkeleton />
        <LogsTableRowSkeleton />
        <LogsTableRowSkeleton />
      </TableBody>
    </Table>
  );
}
