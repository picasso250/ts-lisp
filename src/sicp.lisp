(define nil '())
(define eq? eq)
(define (null? x) (eq x nil))
(define (list  lst)
  (cond 
    ((null? lst) nil)
    (else      (cons 
                (car lst) 
                (cdr lst)))))