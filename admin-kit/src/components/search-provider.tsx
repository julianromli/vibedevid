"use client"

import { createContext, useContext } from "react"
import { CommandMenu } from "./command-menu"

interface SearchContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = createContext<SearchContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: SearchContextType
}

export default function SearchProvider({ children, value }: Props) {
  return (
    <SearchContext.Provider value={value}>
      {children}
      <CommandMenu />
    </SearchContext.Provider>
  )
}

export const useSearch = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) {
    throw new Error("useSearch has to be used within <SearchContext.Provider>")
  }

  return searchContext
}
