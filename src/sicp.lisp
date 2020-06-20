(define nil '())
(define eq? eq)
(define (null? x) (eq x nil))
(define (list  lst)
  (cond 
    ((null? lst) nil)
    (else      (cons 
                (car lst) 
                (cdr lst)))))
(define (list  lst) 
  (cond 
    ((eq '() lst) '())
    (else      (cons 
                (car lst) 
                (cdr lst)))))