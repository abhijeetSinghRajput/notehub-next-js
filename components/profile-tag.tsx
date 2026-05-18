'use client'
import { Button } from './ui/button'
import { useId, useState } from 'react'
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { devicons } from '@/data/dev-icons'


interface ProfileTagProps {
    value: string[]
    onChange: (value: string[]) => void
}

const ProfileTag = ({ value, onChange }: ProfileTagProps) => {
    return (
        <div className="space-y-3">
            <ComboboxMultiple selectedValues={value} setSelectedValues={onChange} />
        </div>
    )
}


const ComboboxMultiple = ({
    selectedValues = [],
    setSelectedValues,
}: {
    selectedValues: string[]
    setSelectedValues: (val: string[]) => void
}) => {
    const id = useId()
    const [open, setOpen] = useState(false)

    const toggleSelection = (value: string) => {
        if (selectedValues.includes(value)) {
            setSelectedValues(selectedValues.filter(v => v !== value))
        } else {
            if (selectedValues.length >= 10) {
                return
            }
            setSelectedValues([...selectedValues, value])
        }
    }

    const removeSelection = (value: string) => {
        setSelectedValues(selectedValues.filter(v => v !== value))
    }

    return (
        <div className='w-full space-y-2'>
            <div className='flex justify-between items-center'>

                <Label htmlFor={id}>Search skills, &amp; tools</Label>
                <span className='text-muted-foreground text-xs'>{selectedValues.length}/10</span>
            </div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        variant='outline'
                        role='combobox'
                        aria-expanded={open}
                        className='h-auto min-h-8 w-full justify-between hover:bg-transparent'
                    >
                        <div className='flex flex-wrap items-center gap-1 pr-2.5'>
                            {selectedValues.length > 0 ? (
                                selectedValues.map(val => {
                                    const icon = devicons[val.toLowerCase() as keyof typeof devicons]

                                    return icon ? (
                                        <Button
                                            key={val}
                                            variant='outline'
                                            className='rounded-sm px-2 py-1 h-6 '
                                            onClick={e => {
                                                e.stopPropagation()
                                                removeSelection(val)
                                            }}
                                        >
                                            <div className='flex items-center gap-1'>
                                                <img
                                                    src={icon.icon}
                                                    alt={val}
                                                    width={14}
                                                    height={14}
                                                    className={icon.isInverted ? 'devicon-invertible dark:invert shrink-0' : 'shrink-0'}
                                                />
                                                <span className='truncate'>{val}</span>
                                                <XIcon className='size-3' />
                                            </div>
                                        </Button>
                                    ) : null
                                })
                            ) : (
                                <span className='text-muted-foreground'>type to search</span>
                            )}
                        </div>
                        <ChevronsUpDownIcon className='text-muted-foreground/80 shrink-0' aria-hidden='true' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side='bottom' className='w-(--radix-popper-anchor-width) p-0'>
                    <Command>
                        <CommandInput placeholder='Search tools and skills' />
                        <CommandList>
                            <CommandEmpty>No tools or skills found</CommandEmpty>
                            <CommandGroup>
                                {Object.entries(devicons).map(([name, details]) => (
                                    <CommandItem
                                        key={name}
                                        value={name}
                                        onSelect={() => toggleSelection(name)}
                                    >
                                        <img
                                            src={details.icon}
                                            alt={name}
                                            width={20}
                                            height={20}
                                            className={details.isInverted ? 'devicon-invertible dark:invert shrink-0' : 'shrink-0'}
                                        />
                                        <span className='truncate'>{name}</span>
                                        {selectedValues.includes(name) && <CheckIcon size={16} className='ml-auto' />}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default ProfileTag