import React, { useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  DeleteConfirmDialog,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Slider,
  Switch,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import {
  CUSTOM_FIELD_ICON_NAMES,
  CustomFieldIcon,
  SectionIcon,
} from '@/components/icons/CustomIcons';
import { useResumeStore } from '@/store/useResumeStore';
import { basicsFormSchema } from '@/schemas/resumeSchemas';
import {
  isValidPhotoUrl,
  uploadProfilePhoto,
  validatePhotoFile,
} from '@/services/photoService';
import { CONFIG } from '@/lib/utils';
import type { CustomFieldItem } from '@/types/resume';

export function BasicsEditor() {
  const { resumeData, updateBasics, resetPhotoSettings } = useResumeStore();
  const { basics } = resumeData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [confirmRemovePhotoOpen, setConfirmRemovePhotoOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photoUrlError, setPhotoUrlError] = useState<string>('');

  const validateSingleField = (path: string, nextBasics = basics) => {
    const parsed = basicsFormSchema.safeParse({
      name: nextBasics.name,
      title: nextBasics.title,
      email: nextBasics.email,
      linkedin: nextBasics.linkedin,
      website: nextBasics.website,
      phone: nextBasics.phone,
      location: nextBasics.location,
      customFields: nextBasics.customFields,
    });

    if (parsed.success) {
      setFieldErrors((prev) => {
        if (!prev[path]) return prev;
        const copy = { ...prev };
        delete copy[path];
        return copy;
      });
    } else {
      const issue = parsed.error.issues.find((i) => i.path.join('.') === path);
      let message = issue ? issue.message : '';
      if (issue && path === 'email') {
        message = 'Use format: name@domain.com';
      } else if (issue && (path === 'linkedin' || path === 'website')) {
        message = 'URL must start with: https://';
      }
      setFieldErrors((prev) => ({
        ...prev,
        [path]: message,
      }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: validation.errorTitle || 'Invalid file',
        description: validation.errorDescription,
      });
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const url = await uploadProfilePhoto(file);
      setPhotoUrlError('');
      updateBasics({
        photo: {
          url,
          size: CONFIG.PHOTO.SIZE.DEFAULT,
          borderRadius: CONFIG.PHOTO.RADIUS.DEFAULT,
          visible: true,
        },
      });
      toast({
        title: 'Photo uploaded',
        description: 'Your profile photo has been updated.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to upload photo',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handlePhotoUrlChange = (rawUrl: string) => {
    updateBasics({
      photo: { ...basics.photo, url: rawUrl },
    });
    if (rawUrl.trim() && !isValidPhotoUrl(rawUrl)) {
      setPhotoUrlError('URL must start with: https://');
    } else {
      setPhotoUrlError('');
    }
  };

  const handleAddCustomField = () => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newField: CustomFieldItem = {
      id,
      iconName: 'link',
      name: '',
      value: '',
      breakAfter: false,
    };
    updateBasics({
      customFields: [...basics.customFields, newField],
    });
  };

  const handleUpdateCustomField = (
    id: string,
    patch: Partial<CustomFieldItem>
  ) => {
    const updated = basics.customFields.map((field) =>
      field.id === id ? { ...field, ...patch } : field
    );
    updateBasics({ customFields: updated });
  };

  const handleRemoveCustomField = (id: string) => {
    updateBasics({
      customFields: basics.customFields.filter((f) => f.id !== id),
    });
  };

  return (
    <section id="section-basics" className="space-y-5">
      <div className="flex items-center gap-2.5">
        <SectionIcon section="basics" className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">Personal Information</h2>
      </div>

      {/* Profile Photo Controls (Du) */}
      <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            data-testid="photo-file-input"
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            title="Click to upload photo"
            className="relative flex aspect-square w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary/60 hover:bg-muted/70"
          >
            {basics.photo.url ? (
              <img
                src={basics.photo.url}
                alt={basics.name || 'Profile'}
                className={`h-full w-full object-cover transition-opacity ${
                  !basics.photo.visible ? 'opacity-35 grayscale' : ''
                }`}
                style={{
                  borderRadius: `${basics.photo.borderRadius}px`,
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 p-2 text-center text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-[11px] leading-tight">
                  {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </span>
              </div>
            )}
          </button>

          <div className="flex flex-1 flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
              </Button>

              {basics.photo.url && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    tooltipContent={
                      basics.photo.visible
                        ? 'Hide photo from CV'
                        : 'Show photo in CV'
                    }
                    onClick={() =>
                      updateBasics({
                        photo: {
                          ...basics.photo,
                          visible: !basics.photo.visible,
                        },
                      })
                    }
                  >
                    {basics.photo.visible ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Show</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                    tooltipContent="Remove photo"
                    onClick={() => setConfirmRemovePhotoOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                </>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="basics-photo-url" className="text-xs">
                Photo URL
              </Label>
              <Input
                id="basics-photo-url"
                placeholder="https://example.com/photo.jpg"
                value={basics.photo.url}
                hasError={Boolean(photoUrlError)}
                onChange={(e) => handlePhotoUrlChange(e.target.value)}
                className="h-8 text-xs"
              />
              {photoUrlError && (
                <p className="text-xs text-destructive">{photoUrlError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Photo Size & Border Radius Controls (visible when photo URL is present) */}
        {basics.photo.url && (
          <div className="grid grid-cols-1 gap-4 border-t border-border/60 pt-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="photo-size-input" className="text-xs">
                  Size ({basics.photo.size}px)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  tooltipContent="Reset size (100px)"
                  onClick={() =>
                    updateBasics({
                      photo: {
                        ...basics.photo,
                        size: CONFIG.PHOTO.SIZE.DEFAULT,
                      },
                    })
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  min={CONFIG.PHOTO.SIZE.MIN}
                  max={CONFIG.PHOTO.SIZE.MAX}
                  step={1}
                  value={[basics.photo.size]}
                  onValueChange={([val]) =>
                    updateBasics({
                      photo: {
                        ...basics.photo,
                        size: val,
                      },
                    })
                  }
                />
                <Input
                  id="photo-size-input"
                  type="number"
                  min={CONFIG.PHOTO.SIZE.MIN}
                  max={CONFIG.PHOTO.SIZE.MAX}
                  value={basics.photo.size}
                  onChange={(e) => {
                    const num = Math.min(
                      CONFIG.PHOTO.SIZE.MAX,
                      Math.max(
                        CONFIG.PHOTO.SIZE.MIN,
                        Number(e.target.value) || CONFIG.PHOTO.SIZE.DEFAULT
                      )
                    );
                    updateBasics({
                      photo: { ...basics.photo, size: num },
                    });
                  }}
                  className="h-8 w-16 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="photo-radius-input" className="text-xs">
                  Border radius ({basics.photo.borderRadius}px)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  tooltipContent="Reset border radius (4px)"
                  onClick={() =>
                    updateBasics({
                      photo: {
                        ...basics.photo,
                        borderRadius: CONFIG.PHOTO.RADIUS.DEFAULT,
                      },
                    })
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  min={CONFIG.PHOTO.RADIUS.MIN}
                  max={CONFIG.PHOTO.RADIUS.MAX}
                  step={1}
                  value={[basics.photo.borderRadius]}
                  onValueChange={([val]) =>
                    updateBasics({
                      photo: {
                        ...basics.photo,
                        borderRadius: val,
                      },
                    })
                  }
                />
                <Input
                  id="photo-radius-input"
                  type="number"
                  min={CONFIG.PHOTO.RADIUS.MIN}
                  max={CONFIG.PHOTO.RADIUS.MAX}
                  value={basics.photo.borderRadius}
                  onChange={(e) => {
                    const num = Math.min(
                      CONFIG.PHOTO.RADIUS.MAX,
                      Math.max(
                        CONFIG.PHOTO.RADIUS.MIN,
                        Number(e.target.value) || 0
                      )
                    );
                    updateBasics({
                      photo: { ...basics.photo, borderRadius: num },
                    });
                  }}
                  className="h-8 w-16 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={confirmRemovePhotoOpen}
        onOpenChange={setConfirmRemovePhotoOpen}
        title="Remove profile photo?"
        description="This will remove the current photo and reset photo styling settings."
        onConfirm={() => {
          resetPhotoSettings();
          setPhotoUrlError('');
          setConfirmRemovePhotoOpen(false);
        }}
      />

      {/* Main Personal Info Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="basics-name">Full Name</Label>
          <Input
            id="basics-name"
            placeholder="John Doe"
            value={basics.name}
            hasError={Boolean(fieldErrors['name'])}
            onChange={(e) => {
              const next = { ...basics, name: e.target.value };
              updateBasics({ name: e.target.value });
              validateSingleField('name', next);
            }}
          />
          {fieldErrors['name'] && (
            <p className="text-xs text-destructive">{fieldErrors['name']}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="basics-title">Job Title / Headline</Label>
          <Input
            id="basics-title"
            placeholder="Software Developer"
            value={basics.title}
            hasError={Boolean(fieldErrors['title'])}
            onChange={(e) => {
              const next = { ...basics, title: e.target.value };
              updateBasics({ title: e.target.value });
              validateSingleField('title', next);
            }}
          />
          {fieldErrors['title'] && (
            <p className="text-xs text-destructive">{fieldErrors['title']}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="basics-email">Email</Label>
          <Input
            id="basics-email"
            type="email"
            placeholder="john.doe@example.com"
            value={basics.email}
            hasError={Boolean(fieldErrors['email'])}
            onChange={(e) => {
              const next = { ...basics, email: e.target.value };
              updateBasics({ email: e.target.value });
              validateSingleField('email', next);
            }}
          />
          {fieldErrors['email'] && (
            <p className="text-xs text-destructive">{fieldErrors['email']}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="basics-linkedin">LinkedIn URL</Label>
          <Input
            id="basics-linkedin"
            placeholder="https://linkedin.com/in/johndoe"
            value={basics.linkedin}
            hasError={Boolean(fieldErrors['linkedin'])}
            onChange={(e) => {
              const next = { ...basics, linkedin: e.target.value };
              updateBasics({ linkedin: e.target.value });
              validateSingleField('linkedin', next);
            }}
          />
          {fieldErrors['linkedin'] && (
            <p className="text-xs text-destructive">{fieldErrors['linkedin']}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="basics-website">Website / Portfolio URL</Label>
          <Input
            id="basics-website"
            placeholder="https://johndoe.com"
            value={basics.website}
            hasError={Boolean(fieldErrors['website'])}
            onChange={(e) => {
              const next = { ...basics, website: e.target.value };
              updateBasics({ website: e.target.value });
              validateSingleField('website', next);
            }}
          />
          {fieldErrors['website'] && (
            <p className="text-xs text-destructive">{fieldErrors['website']}</p>
          )}
        </div>

        {/* Phone with Break After switch */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="basics-phone">Phone</Label>
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="phone-break-after"
                className="cursor-pointer text-xs font-normal text-muted-foreground"
              >
                Break after
              </Label>
              <Switch
                id="phone-break-after"
                disabled={!basics.phone.value.trim()}
                checked={basics.phone.breakAfter}
                onCheckedChange={(checked) =>
                  updateBasics({
                    phone: { ...basics.phone, breakAfter: checked },
                  })
                }
              />
            </div>
          </div>
          <Input
            id="basics-phone"
            placeholder="+1 (555) 234-5678"
            value={basics.phone.value}
            onChange={(e) =>
              updateBasics({
                phone: { ...basics.phone, value: e.target.value },
              })
            }
          />
        </div>

        {/* Location with Break After switch */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="basics-location">Location</Label>
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="location-break-after"
                className="cursor-pointer text-xs font-normal text-muted-foreground"
              >
                Break after
              </Label>
              <Switch
                id="location-break-after"
                disabled={!basics.location.value.trim()}
                checked={basics.location.breakAfter}
                onCheckedChange={(checked) =>
                  updateBasics({
                    location: { ...basics.location, breakAfter: checked },
                  })
                }
              />
            </div>
          </div>
          <Input
            id="basics-location"
            placeholder="Cairo, Egypt"
            value={basics.location.value}
            onChange={(e) =>
              updateBasics({
                location: { ...basics.location, value: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Custom Fields */}
      {basics.customFields.length > 0 && (
        <div className="space-y-3 pt-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom Fields
          </Label>
          <div className="space-y-2.5">
            {basics.customFields.map((field) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-md border border-border bg-card/40 p-2.5 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-2">
                  {/* 15-icon Popover selector */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        tooltipContent="Choose icon"
                      >
                        <CustomFieldIcon
                          iconName={field.iconName}
                          size={16}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                      <div className="grid grid-cols-5 gap-1">
                        {CUSTOM_FIELD_ICON_NAMES.map((iconKey) => (
                          <Button
                            key={iconKey}
                            type="button"
                            variant={
                              field.iconName === iconKey ? 'secondary' : 'ghost'
                            }
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdateCustomField(field.id, {
                                iconName: iconKey,
                              })
                            }
                          >
                            <CustomFieldIcon iconName={iconKey} size={16} />
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Input
                    placeholder="Label (e.g. GitHub)"
                    value={field.name}
                    onChange={(e) =>
                      handleUpdateCustomField(field.id, {
                        name: e.target.value,
                      })
                    }
                    className="h-9 flex-1"
                  />

                  <Input
                    placeholder="Value or URL"
                    value={field.value}
                    onChange={(e) =>
                      handleUpdateCustomField(field.id, {
                        value: e.target.value,
                      })
                    }
                    className="h-9 flex-1"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <div className="flex items-center gap-1.5">
                    <Label
                      htmlFor={`cf-break-${field.id}`}
                      className="cursor-pointer whitespace-nowrap text-xs font-normal text-muted-foreground"
                    >
                      Break after
                    </Label>
                    <Switch
                      id={`cf-break-${field.id}`}
                      checked={Boolean(field.breakAfter)}
                      onCheckedChange={(checked) =>
                        handleUpdateCustomField(field.id, {
                          breakAfter: checked,
                        })
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    tooltipContent="Remove custom field"
                    onClick={() => handleRemoveCustomField(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleAddCustomField}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Custom Field</span>
        </Button>
      </div>

      <Separator className="my-4" />
    </section>
  );
}
