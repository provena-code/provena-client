"use client"

import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { AssignmentSubjectsResponseItem } from "@/api"
import { DataTable } from "@/components/ui/data-table"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

// Extend the API type to allow for additional client-side properties
export type StudentSummary = AssignmentSubjectsResponseItem & {
    // e.g. client-side computed stats
};

const columnHelper = createColumnHelper<StudentSummary>();

const columns: ColumnDef<StudentSummary>[] = [
    columnHelper.accessor("SubjectID", {
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Student
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
        cell: ({ row, table }) => {
            // Annoying that we have to get the assignmentId from the router
            const { assignmentId } = useParams<{ assignmentId: string }>();
            return (
                <Link
                    to={`/assignment/${assignmentId}/student/${row.original.SubjectID}`}
                    className="text-blue-500 hover:underline"
                >
                    {row.original.SubjectID}
                </Link>
            )
        }
    }),
    columnHelper.accessor("InsertTextLength", {
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Added Text
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
    }),
    columnHelper.accessor("DeleteTextLength", {
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Deleted Text
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
    }),
];

interface StudentsTableProps {
    students: StudentSummary[];
}

export function StudentsTable({ students }: StudentsTableProps) {
    return <DataTable columns={columns} data={students} />
}
