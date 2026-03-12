import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Form, FormResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileText,
  Plus,
  Loader2,
  Trash2,
  GripVertical,
  ClipboardList,
  Inbox,
  Eye,
} from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  options: string[];
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
];

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return (
        <Badge variant="outline" className="border-green-400 text-green-600 dark:text-green-400">
          Published
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-600 dark:text-gray-400">
          Draft
        </Badge>
      );
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function createEmptyField(): FormField {
  return {
    id: generateId(),
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: [],
  };
}

function SortableFieldCard({
  field,
  idx,
  totalFields,
  onUpdate,
  onRemove,
}: {
  field: FormField;
  idx: number;
  totalFields: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} data-testid={`card-field-${idx}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
              data-testid={`drag-handle-${idx}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Field {idx + 1}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRemove}
            data-testid={`button-remove-field-${idx}`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input
              data-testid={`input-field-label-${idx}`}
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={field.type}
              onValueChange={(v) => onUpdate({ type: v })}
            >
              <SelectTrigger data-testid={`select-field-type-${idx}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Placeholder</Label>
          <Input
            data-testid={`input-field-placeholder-${idx}`}
            value={field.placeholder}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </div>
        {(field.type === "select" || field.type === "radio") && (
          <div className="space-y-1.5">
            <Label>Options (comma-separated)</Label>
            <Input
              data-testid={`input-field-options-${idx}`}
              value={field.options.join(", ")}
              onChange={(e) =>
                onUpdate({
                  options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
        )}
        <div className="flex items-center justify-between p-2 rounded-md border">
          <Label htmlFor={`required-${idx}`} className="cursor-pointer text-sm">
            Required
          </Label>
          <Switch
            id={`required-${idx}`}
            data-testid={`switch-field-required-${idx}`}
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FieldPreview({ field }: { field: FormField }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {field.label || "Untitled Field"}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea placeholder={field.placeholder} disabled className="bg-muted/50" />
      ) : field.type === "select" ? (
        <Select disabled>
          <SelectTrigger className="bg-muted/50">
            <SelectValue placeholder={field.placeholder || "Select..."} />
          </SelectTrigger>
        </Select>
      ) : field.type === "radio" ? (
        <div className="space-y-2">
          {field.options.length > 0 ? (
            field.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="radio" name={field.id} disabled className="h-4 w-4" />
                {opt}
              </label>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No options defined</p>
          )}
        </div>
      ) : field.type === "checkbox" ? (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" disabled className="h-4 w-4" />
          {field.placeholder || field.label || "Check this"}
        </label>
      ) : field.type === "date" ? (
        <Input type="date" disabled className="bg-muted/50" />
      ) : (
        <Input
          type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : "text"}
          placeholder={field.placeholder}
          disabled
          className="bg-muted/50"
        />
      )}
    </div>
  );
}

export default function HudForms() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("settings");

  const [formData, setFormData] = useState({ name: "", description: "" });

  const [editSettings, setEditSettings] = useState<{
    name: string;
    description: string;
    slug: string;
    status: string;
  }>({ name: "", description: "", slug: "", status: "DRAFT" });

  const [editFields, setEditFields] = useState<FormField[]>([]);

  const formsQuery = useQuery<Form[]>({
    queryKey: ["/api/admin/forms"],
  });

  const formDetailQuery = useQuery<Form>({
    queryKey: ["/api/admin/forms", selectedFormId],
    enabled: !!selectedFormId,
  });

  const responsesQuery = useQuery<FormResponse[]>({
    queryKey: ["/api/admin/forms", selectedFormId, "responses"],
    enabled: !!selectedFormId && activeTab === "responses",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const res = await apiRequest("POST", "/api/admin/forms", {
        name: data.name,
        description: data.description || null,
        slug,
        status: "DRAFT",
        fieldsJson: "[]",
        settingsJson: "{}",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms"] });
      setCreateOpen(false);
      setFormData({ name: "", description: "" });
      toast({ title: "Form created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/forms/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms"] });
      toast({ title: "Form updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forms"] });
      setSelectedFormId(null);
      toast({ title: "Form deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const openDetail = useCallback((form: Form) => {
    setSelectedFormId(form.id);
    setActiveTab("settings");
    setEditSettings({
      name: form.name,
      description: form.description || "",
      slug: form.slug,
      status: form.status,
    });
    try {
      setEditFields(JSON.parse(form.fieldsJson || "[]"));
    } catch {
      setEditFields([]);
    }
  }, []);

  const handleSaveSettings = () => {
    if (!selectedFormId) return;
    updateMutation.mutate({
      id: selectedFormId,
      data: {
        name: editSettings.name,
        description: editSettings.description || null,
        slug: editSettings.slug,
        status: editSettings.status,
      },
    });
  };

  const handleSaveFields = () => {
    if (!selectedFormId) return;
    updateMutation.mutate({
      id: selectedFormId,
      data: {
        fieldsJson: JSON.stringify(editFields),
      },
    });
  };

  const addField = () => {
    setEditFields([...editFields, createEmptyField()]);
  };

  const removeField = (idx: number) => {
    setEditFields(editFields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setEditFields(editFields.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editFields.findIndex((f) => f.id === active.id);
      const newIndex = editFields.findIndex((f) => f.id === over.id);
      setEditFields(arrayMove(editFields, oldIndex, newIndex));
    }
  };

  const forms = formsQuery.data || [];
  const detail = formDetailQuery.data;
  const responses = responsesQuery.data || [];

  const parseResponseData = (dataJson: string): Record<string, string> => {
    try {
      return JSON.parse(dataJson);
    } catch {
      return {};
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <ClipboardList className="h-6 w-6 text-sky-500 dark:text-sky-400" />
            Forms
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Build forms and collect responses
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-form" className="bg-sky-500 hover:bg-sky-600 text-white border-sky-600">
              <Plus className="h-4 w-4 mr-2" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-form">
            <DialogHeader>
              <DialogTitle>Create Form</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="formName">Name *</Label>
                <Input
                  id="formName"
                  data-testid="input-form-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formDesc">Description</Label>
                <Textarea
                  id="formDesc"
                  data-testid="input-form-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white border-sky-600"
                disabled={createMutation.isPending}
                data-testid="button-submit-form"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Form
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {formsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-forms">
              No forms yet. Create your first form to start collecting responses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              className="cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
              data-testid={`card-form-${form.id}`}
              onClick={() => openDetail(form)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" data-testid={`text-form-name-${form.id}`}>
                      {form.name}
                    </div>
                    {form.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{form.description}</p>
                    )}
                  </div>
                  {statusBadge(form.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" data-testid={`text-form-responses-${form.id}`}>
                    <Inbox className="h-3 w-3" />
                    {form.responseCount} response{form.responseCount !== 1 ? "s" : ""}
                  </span>
                  <span data-testid={`text-form-date-${form.id}`}>
                    {new Date(form.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={!!selectedFormId}
        onOpenChange={(open) => {
          if (!open) setSelectedFormId(null);
        }}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto" data-testid="sheet-form-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-sky-500" />
              Form Builder
            </SheetTitle>
          </SheetHeader>

          {formDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="settings" data-testid="tab-settings" className="flex-1">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="fields" data-testid="tab-fields" className="flex-1">
                  Fields
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview" className="flex-1">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="responses" data-testid="tab-responses" className="flex-1">
                  Responses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    data-testid="input-edit-form-name"
                    value={editSettings.name}
                    onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    data-testid="input-edit-form-description"
                    value={editSettings.description}
                    onChange={(e) => setEditSettings({ ...editSettings, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    data-testid="input-edit-form-slug"
                    value={editSettings.slug}
                    onChange={(e) => setEditSettings({ ...editSettings, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editSettings.status}
                    onValueChange={(v) => setEditSettings({ ...editSettings, status: v })}
                  >
                    <SelectTrigger data-testid="select-form-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white border-sky-600"
                  data-testid="button-save-settings"
                  disabled={updateMutation.isPending}
                  onClick={handleSaveSettings}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600"
                  data-testid="button-delete-form"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (selectedFormId) deleteMutation.mutate(selectedFormId);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Form
                </Button>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4 mt-4">
                {editFields.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground" data-testid="text-empty-fields">
                        No fields yet. Add your first field below.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={editFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {editFields.map((field, idx) => (
                          <SortableFieldCard
                            key={field.id}
                            field={field}
                            idx={idx}
                            totalFields={editFields.length}
                            onUpdate={(updates) => updateField(idx, updates)}
                            onRemove={() => removeField(idx)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addField}
                  data-testid="button-add-field"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
                <Button
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white border-sky-600"
                  data-testid="button-save-fields"
                  disabled={updateMutation.isPending}
                  onClick={handleSaveFields}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Fields
                </Button>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="rounded-lg border overflow-hidden" data-testid="form-preview-container">
                  <div className="bg-muted/50 p-6 border-b">
                    <h3 className="text-lg font-semibold">{editSettings.name || "Untitled Form"}</h3>
                    {editSettings.description && (
                      <p className="text-sm text-muted-foreground mt-1">{editSettings.description}</p>
                    )}
                  </div>
                  <div className="p-6 space-y-5">
                    {editFields.length === 0 ? (
                      <div className="py-8 text-center">
                        <Eye className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Add fields to see a preview of your form
                        </p>
                      </div>
                    ) : (
                      editFields.map((field, idx) => (
                        <div key={field.id} data-testid={`preview-field-${idx}`}>
                          <FieldPreview field={field} />
                        </div>
                      ))
                    )}
                    {editFields.length > 0 && (
                      <>
                        <Separator />
                        <Button className="w-full bg-sky-500 text-white" disabled>
                          Submit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="responses" className="space-y-4 mt-4">
                {responsesQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : responses.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Inbox className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground" data-testid="text-empty-responses">
                        No responses yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Submitted</TableHead>
                          {editFields.map((f, i) => (
                            <TableHead key={i} className="text-xs">
                              {f.label || `Field ${i + 1}`}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.map((resp) => {
                          const data = parseResponseData(resp.dataJson);
                          return (
                            <TableRow key={resp.id} data-testid={`row-response-${resp.id}`}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(resp.submittedAt).toLocaleString()}
                              </TableCell>
                              {editFields.map((f, i) => (
                                <TableCell key={i} className="text-xs max-w-[200px] truncate">
                                  {data[f.label] || data[f.id] || "\u2014"}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
