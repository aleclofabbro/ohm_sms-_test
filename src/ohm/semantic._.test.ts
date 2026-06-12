
export const q1 = `
ON User(1,2,3)
  SET status: "active"
  SET role: "admin"
`;
type User<idType extends string | number =number> = {
   id: idType
   status: string, 
   role: string 
}
export const Users:User[] = [
    { id: 1, status: '1', role: '1' },
    { id: 2, status: '2', role: '2' },
    { id: 3, status: '3', role: '3' },
    { id: 4, status: '4', role: '4' },
]
