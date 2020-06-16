(define (list.  lst)
  (cond 
    ((null? lst) nil)
    (else      (cons 
                (car lst) 
                (cdr lst)))))