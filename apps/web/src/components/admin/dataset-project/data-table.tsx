"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addToProject } from "@/actions/dataset";
import { ProjectDropdown } from "@/components/dropdown/project-dropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DatasetProjectsTableProps = {
  datasetId: string;
  organizationId: string;
};

export function DatasetProjectsTable({ datasetId, organizationId }: DatasetProjectsTableProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isAddingToProject, setIsAddingToProject] = useState(false);

  const invoices = [
    {
      invoice: "INV001",
      paymentStatus: "Paid",
      totalAmount: "$250.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV002",
      paymentStatus: "Pending",
      totalAmount: "$150.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV003",
      paymentStatus: "Unpaid",
      totalAmount: "$350.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV004",
      paymentStatus: "Paid",
      totalAmount: "$450.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV005",
      paymentStatus: "Paid",
      totalAmount: "$550.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV006",
      paymentStatus: "Pending",
      totalAmount: "$200.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV007",
      paymentStatus: "Unpaid",
      totalAmount: "$300.00",
      paymentMethod: "Credit Card",
    },
  ];

  const handleAddToProject = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first.");
      return;
    }

    setIsAddingToProject(true);
    try {
      await addToProject(datasetId, selectedProject);
      toast.success("Dataset added to project successfully!");
    } catch (error) {
      console.error("Failed to add dataset to project:", error);
      toast.error("Failed to add dataset to project.");
    } finally {
      setIsAddingToProject(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>A dataset can be added to one or more projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectDropdown onValueChange={setSelectedProject} organizationId={organizationId} />
        {selectedProject && <p className="mt-2">Selected Project ID: {selectedProject}</p>}
        <Button className="mt-4" onClick={handleAddToProject} disabled={!selectedProject || isAddingToProject}>
          {isAddingToProject ? "Adding..." : "Add to project"}
        </Button>
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.invoice}>
                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className="text-right">{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
