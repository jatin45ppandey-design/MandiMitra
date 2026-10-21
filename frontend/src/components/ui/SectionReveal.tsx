import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

interface SectionRevealProps extends Omit<HTMLMotionProps<'section'>, 'children'> {
  children: ReactNode
}

export function SectionReveal({
  children,
  className = '',
  ...props
}: SectionRevealProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      {...props}
      className={className}
      initial={reduceMotion ? false : { opacity: 1, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}

