import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination.tsx";

export interface IUnknownCountListPaginationProps {
  hasMore: boolean;
  page: number;
  pageSize: number;
  disabled: boolean;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

function UnknownCountListPagination(props: IUnknownCountListPaginationProps) {
  const {
    className,
    style,
    hasMore,
    page,
    pageSize,
    disabled,
    setPage,
    setPageSize,
  } = props;

  const onPaginationChange = (inputPage: number, inputPageSize: number) => {
    if (disabled) return;

    if (page !== inputPage) {
      setPage(inputPage);
    }

    if (pageSize !== inputPageSize) {
      setPageSize(inputPageSize);
    }
  };

  return (
    <Pagination className={className} style={style}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            disabled={page === 0 || disabled}
            onClick={() => onPaginationChange(page - 1, pageSize)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            disabled={!hasMore || disabled}
            onClick={() => onPaginationChange(page + 1, pageSize)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default React.memo(
  UnknownCountListPagination as React.FC<IUnknownCountListPaginationProps>
);
