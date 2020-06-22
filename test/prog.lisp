(define add
  (lambda (a)
    (lambda (b)
      (+ a b))))
((add 3) 4)

(define fact
  (lambda (n)
    (cond
      ((eq n 0) 1)
      (else (* n (fact (- n 1)))))))
(fact 4)

(define len
  (lambda (lst)
    (cond ((eq lst '()) 0)
          (else (+ 1 (len (cdr lst)))))))
(len '(a b c))

(define fact
  (lambda (n)
    (cond
      ((eq n 0) 1)
      (else (* n (fact (- n 1)))))))
(define Y
  (lambda (h)
    (lambda (f)
      (h (lambda v ((f f) v) )) )
    (lambda (f)
      (h (lambda v ((f f) v) )) ) ))
(fact 4)