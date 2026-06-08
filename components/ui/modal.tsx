'use client'

import React from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

const ModalContext = React.createContext<{ isMobile: boolean } | null>(null)

function useModalContext() {
  const context = React.use(ModalContext)
  if (!context) {
    throw new Error('Modal sub-components must be used within <Modal>')
  }
  return context
}

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOpen?: boolean
  children: React.ReactNode
  drawerDismissible?: boolean
}

function Modal({ open, onOpenChange, defaultOpen, drawerDismissible, children }: ModalProps) {
  const isMobile = useIsMobile()
  const Component = isMobile ? Drawer : Dialog

  return (
    <ModalContext.Provider value={{ isMobile }}>
      <Component
        open={open}
        onOpenChange={onOpenChange}
        defaultOpen={defaultOpen}
        {...(isMobile && { dismissible: drawerDismissible })}
      >
        {children}
      </Component>
    </ModalContext.Provider>
  )
}

function ModalTrigger({ className, children, asChild }: { className?: string; children: React.ReactNode; asChild?: boolean }) {
  const { isMobile } = useModalContext()
  const Component = isMobile ? DrawerTrigger : DialogTrigger

  return (
    <Component
      className={className}
      asChild={asChild}
    >
      {children}
    </Component>
  )
}

function ModalClose({ className, children, asChild }: { className?: string; children?: React.ReactNode; asChild?: boolean }) {
  const { isMobile } = useModalContext()
  const Component = isMobile ? DrawerClose : DialogClose

  return (
    <Component
      className={className}
      asChild={asChild}
    >
      {children}
    </Component>
  )
}

function ModalContent({ className, children }: { children: React.ReactNode; className?: string }) {
  const { isMobile } = useModalContext()
  const Component = isMobile ? DrawerContent : DialogContent

  return <Component className={className}>{children}</Component>
}

function ModalHeader({ className, ...props }: React.ComponentProps<'div'>) {
  const { isMobile } = useModalContext()
  const Component = isMobile ? DrawerHeader : DialogHeader

  return <Component className={className} {...props} />
}

function ModalTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  const { isMobile } = useModalContext()
  const Component = isMobile ? DrawerTitle : DialogTitle

  return <Component className={className}>{children}</Component>
}

function ModalDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  const { isMobile } = useModalContext()
  const Component = isMobile ? DrawerDescription : DialogDescription

  return <Component className={className}>{children}</Component>
}

function ModalBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('px-4 py-6', className)}
      {...props}
    />
  )
}

function ModalFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const { isMobile } = useModalContext()
  const Component = isMobile ? DrawerFooter : DialogFooter
  return <Component className={className} {...props} />
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
}
