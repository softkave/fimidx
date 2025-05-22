import React, { ReactElement } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination.tsx";

export interface IListPaginationProps {
  count: number;
  page: number;
  pageSize: number;
  disabled: boolean;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

function ListPagination(props: IListPaginationProps) {
  const {
    className,
    style,
    count,
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

  let pNode: ReactElement = <></>;
  const maxPage = Math.ceil(count / pageSize);
  const pMax = Math.min(3, maxPage);
  const pSide = Math.floor(pMax / 2);
  const pEnd = Math.min(maxPage, page + pSide);
  let pStart = Math.max(1, page - pSide);
  if (pStart + pMax > maxPage) {
    pStart = maxPage - pMax + 1;
  }

  const pList = Array.from({ length: pMax }, (_, i) => pStart + i);
  const hasEllipsisBefore = pStart > 1;
  const hasEllipsisAfter = pEnd < maxPage;

  if (count > 0 && pList.length && maxPage > 1) {
    pNode = (
      <Pagination className={className} style={style}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              disabled={page === 1 || disabled}
              onClick={() => onPaginationChange(page - 1, pageSize)}
            />
          </PaginationItem>
          {hasEllipsisBefore && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {pList.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                disabled={disabled}
                onClick={() => onPaginationChange(p, pageSize)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          {hasEllipsisAfter && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              disabled={page === maxPage || disabled}
              onClick={() => onPaginationChange(page + 1, pageSize)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  // TODO: show count
  return pNode;
}

export default React.memo(ListPagination as React.FC<IListPaginationProps>);
