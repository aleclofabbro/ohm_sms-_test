
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
    { id: 1, status: 'status_1', role: 'role_1' },
    { id: 2, status: 'status_2', role: 'role_2' },
    { id: 3, status: 'status_3', role: 'role_3' },
    { id: 4, status: 'status_4', role: 'role_4' },
]
export const Model = {
  User: Users
}